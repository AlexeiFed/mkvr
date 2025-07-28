/**
 * @file: ChildWorkshopSignUp.tsx
 * @description: Форма записи на мастер-класс для ребёнка с новым UI карточки комплектующих
 * @dependencies: React, MUI, types, модальные окна, галерея, Redux
 * @created: 2024-07-12
 * @updated: 2024-07-12
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Fade,
    Slide,
    Zoom,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Close as CloseIcon } from '@mui/icons-material';
import type { Workshop, WorkshopOrder } from '../../types';
import type { User } from '../../store/authSlice';
import type { SubService } from '../../store/subServicesSlice';
import ComplectationCard from '../orders/ComplectationCard';

interface ChildWorkshopSignUpProps {
    open: boolean;
    workshop: Workshop | null;
    currentUser: User;
    onClose: () => void;
    onSuccess: () => void;
    order?: WorkshopOrder | null; // <--- добавлено
    editMode?: boolean; // <--- добавлено
}

interface SignUpFormData {
    penType: 'regular' | 'double' | 'light';
    varnish: 'regular' | 'sparkle';
    stickers: string[];
    personalInscription: string;
    selectedComplectations: Array<{ subServiceId: number; variantId?: number }>;
}

const ChildWorkshopSignUp: React.FC<ChildWorkshopSignUpProps> = ({
    open,
    workshop,
    currentUser,
    onClose,
    onSuccess,
    order,
    editMode
}) => {
    const [formData, setFormData] = useState<SignUpFormData>({
        penType: 'regular',
        varnish: 'regular',
        stickers: [],
        personalInscription: '',
        selectedComplectations: []
    });
    const [complectations, setComplectations] = useState<SubService[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<{ [complectationId: number]: number }>({});
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCancelSuccess, setShowCancelSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Галерея и видео модалки
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [videoOpen, setVideoOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>('');

    const handleShowPhotos = (photos: string[], startIndex: number) => {
        setGalleryPhotos(photos);
        setGalleryIndex(startIndex);
        setGalleryOpen(true);
    };

    const handleShowVideo = (video: string) => {
        setVideoUrl(video);
        setVideoOpen(true);
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Загрузка комплектации для мастер-класса
    useEffect(() => {
        if (open && workshop?.service?.id) {
            fetch(`http://localhost:3001/api/subServices/service/${workshop.service.id}`)
                .then(response => response.json())
                .then(data => {
                    console.log('Ответ backend по комплектующим:', data);
                    if (data.success && Array.isArray(data.subServices)) {
                        // Фильтрация по возрасту
                        const availableComplectations = data.subServices.filter(
                            (comp: SubService) => !comp.minAge || comp.minAge <= (currentUser.age || 0)
                        );
                        // Сортировка по полю order для синхронизации с порядком админа
                        const sortedComplectations = availableComplectations.sort((a: SubService, b: SubService) => (a.order ?? 0) - (b.order ?? 0));
                        setComplectations(sortedComplectations);
                    } else {
                        setComplectations([]);
                    }
                })
                .catch(err => {
                    console.error('Ошибка загрузки комплектации:', err);
                    setComplectations([]);
                });
        }
    }, [open, workshop, currentUser.age]);

    // При открытии в режиме редактирования подставлять значения заказа
    useEffect(() => {
        if (open && editMode && order) {
            console.log('[DEBUG] order для редактирования:', order);

            // Создаем объект selectedVariants из orderComplectations
            const initialSelectedVariants: { [complectationId: number]: number } = {};
            (order.orderComplectations || []).forEach(oc => {
                const variantId = (oc as { variantId?: number }).variantId;
                if (variantId) {
                    initialSelectedVariants[oc.subServiceId] = variantId;
                }
            });

            console.log('[DEBUG] initialSelectedVariants:', initialSelectedVariants);
            setSelectedVariants(initialSelectedVariants);
            setFormData({
                penType: order.penType,
                varnish: order.varnish,
                stickers: order.stickers || [],
                personalInscription: order.personalInscription || '',
                selectedComplectations: (order.orderComplectations || []).map(oc => ({
                    subServiceId: oc.subServiceId,
                    variantId: (oc as { variantId?: number }).variantId
                }))
            });
        } else if (open && !editMode) {
            setSelectedVariants({});
            setFormData({
                penType: 'regular',
                varnish: 'regular',
                stickers: [],
                personalInscription: '',
                selectedComplectations: []
            });
        }
    }, [open, editMode, order]);

    const calculateTotalPrice = () => {
        let total = 0;
        console.log('[DEBUG] calculateTotalPrice - selectedComplectations:', formData.selectedComplectations);

        formData.selectedComplectations.forEach(comp => {
            const complectation = complectations.find(c => c.id === comp.subServiceId);
            console.log('[DEBUG] complectation found:', complectation?.name, 'variantId:', comp.variantId);

            if (complectation) {
                if (complectation.hasVariants && complectation.variants && complectation.variants.length > 0) {
                    const selectedVariant = complectation.variants.find(v => v.id === comp.variantId);
                    console.log('[DEBUG] selectedVariant:', selectedVariant?.name, 'price:', selectedVariant?.price);
                    if (selectedVariant) {
                        total += selectedVariant.price;
                    }
                } else {
                    console.log('[DEBUG] no variants, using complectation price:', complectation.price);
                    total += complectation.price || 0;
                }
            }
        });

        console.log('[DEBUG] total calculated:', total);
        return total;
    };

    // Определяем parentId корректно (MVP: parentId = id ребёнка)
    const getParentId = () => currentUser.id;

    const handleCancelOrder = async () => {
        if (!order) return;

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:3001/api/orders/${order.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            if (result.success) {
                setShowCancelSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    setShowCancelSuccess(false);
                }, 1500);
            } else {
                setError(result.error || 'Ошибка при отмене заказа');
            }
        } catch {
            setError('Ошибка отмены заказа');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!workshop) return;

        setSubmitting(true);
        setError(null);

        // Проверка 24 часов до мастер-класса (исправленная логика)
        const now = new Date();
        const wsDate = new Date(workshop.date + 'T' + (workshop.time || '00:00'));
        const diffMs = wsDate.getTime() - now.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);

        // Проверяем только если это редактирование и до мастер-класса менее 24 часов
        if (editMode && diffHrs > 0 && diffHrs < 24) {
            setError('Изменять комплектацию можно только за 24 часа до начала мастер-класса');
            setSubmitting(false);
            return;
        }

        try {
            if (editMode && order) {
                // PATCH/PUT для обновления заказа
                const orderData = {
                    penType: formData.penType,
                    varnish: formData.varnish,
                    stickers: formData.stickers,
                    personalInscription: formData.personalInscription,
                    amount: calculateTotalPrice(),
                    selectedComplectations: formData.selectedComplectations
                };
                const response = await fetch(`http://localhost:3001/api/orders/${order.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData),
                });
                const result = await response.json();
                if (result.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                        setShowSuccess(false);
                    }, 1500);
                } else {
                    setError(result.error || 'Ошибка при обновлении заказа');
                }
            } else {
                const orderData = {
                    childId: currentUser.id,
                    parentId: getParentId(),
                    school: currentUser.school || '',
                    grade: currentUser.grade || '',
                    shift: currentUser.shift || '',
                    penType: formData.penType,
                    varnish: formData.varnish,
                    stickers: formData.stickers,
                    personalInscription: formData.personalInscription,
                    amount: calculateTotalPrice(),
                    workshopDate: workshop.date,
                    selectedComplectations: formData.selectedComplectations,
                    workshopId: workshop.id
                };
                const response = await fetch('http://localhost:3001/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData),
                });
                const result = await response.json();
                if (result.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                        setShowSuccess(false);
                    }, 1500);
                } else {
                    // setError(result.error || 'Ошибка при создании заказа');
                }
            }
        } catch {
            setError('Ошибка сохранения заказа');
        } finally {
            setSubmitting(false);
        }
    };

    // Сортировка комплектующих по order
    const sortedComplectations = [...complectations].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!workshop) return null;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 4,
                        background: 'linear-gradient(135deg, #FFF9C4 60%, #FFECB3 100%)',
                        backdropFilter: 'blur(10px)',
                        maxHeight: isMobile ? '100vh' : '90vh',
                        boxShadow: '0 8px 32px rgba(255, 235, 59, 0.15)'
                    }
                }}
                TransitionComponent={Slide}
                transitionDuration={400}
            >
                <DialogTitle sx={{
                    fontFamily: 'Fredoka One, Arial, sans-serif',
                    fontSize: isMobile ? 26 : 32,
                    color: '#FFB300',
                    textAlign: 'center',
                    pb: 1
                }}>
                    <Zoom in={open}>
                        <Box>Собери свой набор! <span role="img" aria-label="star">⭐</span></Box>
                    </Zoom>
                </DialogTitle>
                <DialogContent sx={{
                    background: 'none',
                    p: isMobile ? 1 : 3
                }}>
                    {/* Подсказка */}
                    <Box sx={{
                        textAlign: 'center',
                        mb: 2,
                        fontSize: isMobile ? 18 : 22,
                        color: '#FFA000',
                        fontFamily: 'Fredoka One, Arial, sans-serif'
                    }}>
                        Выбери то, что тебе нравится!
                    </Box>
                    {/* Карточки комплектующих */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
                        {sortedComplectations.length === 0 && (
                            <Typography color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
                                Нет доступных комплектующих для твоего возраста
                            </Typography>
                        )}
                        {sortedComplectations.map(comp => (
                            <ComplectationCard
                                key={comp.id}
                                complectation={comp}
                                selectedComplectations={formData.selectedComplectations}
                                setSelectedComplectations={(newSelected) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        selectedComplectations: typeof newSelected === 'function'
                                            ? newSelected(prev.selectedComplectations)
                                            : newSelected
                                    }));
                                }}
                                selectedVariants={selectedVariants}
                                setSelectedVariants={setSelectedVariants}
                                onShowPhotos={handleShowPhotos}
                                onShowVideo={handleShowVideo}
                            />
                        ))}
                    </Box>
                    {/* Список выбранных */}
                    {formData.selectedComplectations.length > 0 && (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            mb: 2,
                            px: 2,
                            py: 1,
                            background: 'rgba(255, 236, 179, 0.5)',
                            borderRadius: 3,
                            boxShadow: '0 2px 8px #FFD60022',
                        }}>
                            <Typography sx={{ fontWeight: 700, fontSize: isMobile ? 18 : 22, color: '#FFA000', mb: 1, fontFamily: 'Fredoka One, Nunito, Arial' }}>
                                Вы выбрали:
                            </Typography>
                            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, width: '100%' }}>
                                {formData.selectedComplectations.map(comp => {
                                    const complectation = complectations.find(c => c.id === comp.subServiceId);
                                    if (!complectation) return null;

                                    let displayText = complectation.name;

                                    if (complectation.hasVariants && complectation.variants && comp.variantId) {
                                        const selectedVariant = complectation.variants.find(v => v.id === comp.variantId);
                                        if (selectedVariant) {
                                            displayText = `${complectation.name} - ${selectedVariant.name}`;
                                        }
                                    }

                                    return (
                                        <li key={comp.subServiceId}>
                                            <Typography sx={{ fontSize: isMobile ? 16 : 20, color: '#333', fontWeight: 600, fontFamily: 'Nunito, Arial', py: 0.5 }}>
                                                {displayText}
                                            </Typography>
                                        </li>
                                    );
                                })}
                            </Box>
                        </Box>
                    )}
                    {/* Итоговая сумма */}
                    <Box sx={{
                        textAlign: 'center',
                        fontSize: isMobile ? 22 : 28,
                        fontWeight: 'bold',
                        color: '#388E3C',
                        fontFamily: 'Fredoka One, Arial, sans-serif',
                        mb: 2
                    }}>
                        Итого: {calculateTotalPrice()} <span role="img" aria-label="rub">₽</span>
                    </Box>
                    {/* Ошибка */}
                    {error && (
                        <Box sx={{ color: 'red', textAlign: 'center', mb: 2 }}>{error}</Box>
                    )}
                </DialogContent>
                <DialogActions sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'center',
                    pb: isMobile ? 2 : 3,
                    pt: 0
                }}>
                    <Button
                        onClick={onClose}
                        startIcon={<CloseIcon />}
                        sx={{
                            fontFamily: 'Fredoka One, Arial, sans-serif',
                            color: '#666',
                            fontSize: isMobile ? 16 : 18
                        }}
                    >
                        Закрыть
                    </Button>

                    {editMode && order && (
                        <Button
                            onClick={handleCancelOrder}
                            disabled={submitting}
                            variant="contained"
                            sx={{
                                background: 'linear-gradient(90deg, #F44336 60%, #D32F2F 100%)',
                                color: 'white',
                                fontFamily: 'Fredoka One, Arial, sans-serif',
                                fontSize: isMobile ? 16 : 18,
                                fontWeight: 'bold',
                                borderRadius: 3,
                                px: isMobile ? 3 : 4,
                                py: isMobile ? 1 : 1.5,
                                boxShadow: '0 4px 16px rgba(244, 67, 54, 0.18)',
                                textTransform: 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #D32F2F 60%, #F44336 100%)',
                                    boxShadow: '0 6px 20px rgba(244, 67, 54, 0.25)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            {submitting ? 'Отменяем...' : 'Отменить заказ'}
                        </Button>
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        variant="contained"
                        startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                        sx={{
                            background: 'linear-gradient(90deg, #FFD600 60%, #FFB300 100%)',
                            color: '#333',
                            fontFamily: 'Fredoka One, Arial, sans-serif',
                            fontSize: isMobile ? 20 : 24,
                            fontWeight: 'bold',
                            borderRadius: 3,
                            px: isMobile ? 4 : 6,
                            py: isMobile ? 1.5 : 2,
                            boxShadow: '0 4px 16px rgba(255, 235, 59, 0.18)',
                            textTransform: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #FFB300 60%, #FFD600 100%)',
                                boxShadow: '0 6px 20px rgba(255, 235, 59, 0.25)',
                                transform: 'translateY(-2px)'
                            },
                            '&:active': {
                                transform: 'translateY(0px) scale(0.98)'
                            }
                        }}
                    >
                        {submitting ? (editMode ? 'Сохраняем...' : 'Записываемся...') : (editMode ? 'Сохранить' : 'Записаться!')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Модалка галереи фото */}
            <Dialog
                open={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                    }
                }}
            >
                <DialogTitle sx={{
                    textAlign: 'center',
                    fontFamily: 'Fredoka One, Arial, sans-serif',
                    color: '#1976D2'
                }}>
                    Галерея фото 📸
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 320 }}>
                        {galleryPhotos && galleryPhotos.length > 0 && galleryIndex >= 0 && galleryIndex < galleryPhotos.length ? (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Button
                                        onClick={() => setGalleryIndex((galleryIndex - 1 + galleryPhotos.length) % galleryPhotos.length)}
                                        disabled={galleryPhotos.length <= 1}
                                        sx={{
                                            background: 'linear-gradient(45deg, #2196F3, #42A5F5)',
                                            color: 'white',
                                            borderRadius: 3,
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #1976D2, #2196F3)',
                                            }
                                        }}
                                    >
                                        ←
                                    </Button>
                                    <img
                                        src={galleryPhotos[galleryIndex] && galleryPhotos[galleryIndex].startsWith('http') ? galleryPhotos[galleryIndex] : `http://localhost:3001${galleryPhotos[galleryIndex] || ''}`}
                                        alt={`Фото ${galleryIndex + 1}`}
                                        style={{
                                            maxWidth: '80vw',
                                            maxHeight: '60vh',
                                            borderRadius: 16,
                                            boxShadow: '0 8px 32px rgba(33, 150, 243, 0.3)'
                                        }}
                                        onError={e => { e.currentTarget.src = '/no-image.png'; }}
                                    />
                                    <Button
                                        onClick={() => setGalleryIndex((galleryIndex + 1) % galleryPhotos.length)}
                                        disabled={galleryPhotos.length <= 1}
                                        sx={{
                                            background: 'linear-gradient(45deg, #2196F3, #42A5F5)',
                                            color: 'white',
                                            borderRadius: 3,
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #1976D2, #2196F3)',
                                            }
                                        }}
                                    >
                                        →
                                    </Button>
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: 'Fredoka One, Arial, sans-serif',
                                        color: '#1976D2',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Фото {galleryIndex + 1} из {galleryPhotos.length}
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="body1" color="text.secondary">
                                Фотографии не найдены
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Модалка видео */}
            <Dialog
                open={videoOpen}
                onClose={() => setVideoOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)',
                    }
                }}
            >
                <DialogTitle sx={{
                    textAlign: 'center',
                    fontFamily: 'Fredoka One, Arial, sans-serif',
                    color: '#E91E63'
                }}>
                    Видео 🎬
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {videoUrl ? (
                            <video
                                src={videoUrl && videoUrl.startsWith('http') ? videoUrl : `http://localhost:3001${videoUrl || ''}`}
                                controls
                                style={{
                                    maxWidth: '80vw',
                                    maxHeight: '60vh',
                                    borderRadius: 16,
                                    background: '#000',
                                    boxShadow: '0 8px 32px rgba(233, 30, 99, 0.3)'
                                }}
                                poster="/no-image.png"
                                onError={e => { e.currentTarget.poster = '/no-image.png'; }}
                            />
                        ) : (
                            <Typography variant="body1" color="text.secondary">
                                Видео не найдено
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Анимация успеха */}
            <Fade in={showSuccess}>
                <Box
                    sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        p: 4,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                        fontFamily: 'Fredoka One, Arial, sans-serif',
                        fontSize: 24,
                    }}
                >
                    <CheckCircleIcon sx={{ fontSize: 64 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Успешно записались! 🎉
                    </Typography>
                </Box>
            </Fade>

            {/* Анимация отмены заказа */}
            <Fade in={showCancelSuccess}>
                <Box
                    sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        p: 4,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #F44336 0%, #E57373 100%)',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
                        fontFamily: 'Fredoka One, Arial, sans-serif',
                        fontSize: 24,
                    }}
                >
                    <CheckCircleIcon sx={{ fontSize: 64 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Заказ отменен! ❌
                    </Typography>
                </Box>
            </Fade>
        </>
    );
};

export default ChildWorkshopSignUp; 