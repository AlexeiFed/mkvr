/**
 * @file: ComplectationCard.tsx
 * @description: Компонент карточки комплектации для формы заказа ребенка с детским дизайном
 * @dependencies: react, @mui/material, @mui/icons-material
 * @created: 2025-01-12
 */

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    Tabs,
    Tab,
    IconButton,
    Snackbar,
    Alert,
    Grow,
    Zoom,
    Tooltip
} from '@mui/material';
import {
    PlayCircle as PlayCircleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    PhotoLibrary as PhotoLibraryIcon
} from '@mui/icons-material';
import type { SubService } from '../../store/subServicesSlice';

interface ComplectationCardProps {
    complectation: SubService;
    selectedComplectations: Array<{ subServiceId: number; variantId?: number }>;
    setSelectedComplectations: React.Dispatch<React.SetStateAction<Array<{ subServiceId: number; variantId?: number }>>>;
    selectedVariants: { [complectationId: number]: number };
    setSelectedVariants: React.Dispatch<React.SetStateAction<{ [complectationId: number]: number }>>;
}

const ComplectationCard: React.FC<ComplectationCardProps> = ({
    complectation,
    selectedComplectations,
    setSelectedComplectations,
    selectedVariants,
    setSelectedVariants
}) => {
    // Инициализируем selectedTab на основе уже выбранного варианта
    const getInitialSelectedTab = () => {
        if (complectation.variants && complectation.variants.length > 0 && selectedVariants[complectation.id]) {
            const selectedVariantId = selectedVariants[complectation.id];
            const variantIndex = complectation.variants.findIndex(v => v.id === selectedVariantId);
            return variantIndex >= 0 ? variantIndex : 0;
        }
        return 0;
    };

    const [selectedTab, setSelectedTab] = useState(getInitialSelectedTab);
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Обновляем selectedTab при изменении selectedVariants
    useEffect(() => {
        if (complectation.variants && complectation.variants.length > 0 && selectedVariants[complectation.id]) {
            const selectedVariantId = selectedVariants[complectation.id];
            const variantIndex = complectation.variants.findIndex(v => v.id === selectedVariantId);
            if (variantIndex >= 0) {
                setSelectedTab(variantIndex);
            }
        }
    }, [selectedVariants, complectation.id, complectation.variants]);

    const isSelected = selectedComplectations?.some(comp => comp.subServiceId === complectation.id) || false;

    const handleSelectionChange = (complectationId: number, selected: boolean) => {
        if (selected) {
            let finalVariantId = selectedVariants[complectationId];
            console.log('[DEBUG] handleSelectionChange - initial finalVariantId:', finalVariantId);

            // Автоматически выбираем первый вариант только если комплектация еще не была выбрана
            if (complectation.variants && complectation.variants.length > 0) {
                if (finalVariantId === undefined) {
                    const firstVariant = complectation.variants[0];
                    if (firstVariant && firstVariant.id !== undefined) {
                        finalVariantId = firstVariant.id;
                        console.log('[DEBUG] Auto-selecting first variant:', firstVariant.name, 'id:', firstVariant.id);
                        setSelectedVariants(prev => ({
                            ...prev,
                            [complectationId]: firstVariant.id!
                        }));
                    }
                }
            }

            console.log('[DEBUG] Final variantId for complectation:', finalVariantId);
            // Теперь добавляем комплектацию с правильным variantId
            setSelectedComplectations(prev => [...(prev || []), {
                subServiceId: complectationId,
                variantId: finalVariantId
            }]);

            let variantName = 'стандартный';
            if (complectation.variants && complectation.variants.length > 0) {
                if (finalVariantId) {
                    const selectedVariant = complectation.variants.find(v => v.id === finalVariantId);
                    variantName = selectedVariant?.name || complectation.variants[selectedTab]?.name || 'стандартный';
                } else {
                    variantName = complectation.variants[selectedTab]?.name || 'стандартный';
                }
            }
            setNotification({
                open: true,
                message: `Выбрана комплектация "${complectation.name}" с вариантом "${variantName}"! 🎉`,
                severity: 'success'
            });
        } else {
            setSelectedComplectations(prev => (prev || []).filter(comp => comp.subServiceId !== complectationId));
            setSelectedVariants(prev => {
                const newVariants = { ...prev };
                delete newVariants[complectationId];
                return newVariants;
            });
            setNotification({
                open: true,
                message: `Комплектация "${complectation.name}" удалена из заказа! ❌`,
                severity: 'info'
            });
        }
    };

    const handleVariantChange = (complectationId: number, variantId: number) => {
        setSelectedVariants(prev => ({
            ...prev,
            [complectationId]: variantId
        }));
        const variant = complectation.variants?.find(v => v.id === variantId);
        if (variant) {
            setNotification({
                open: true,
                message: `Выбран вариант "${variant.name}"! ✨`,
                severity: 'success'
            });
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
        if (complectation.variants && complectation.variants[newValue]) {
            handleVariantChange(complectation.id, complectation.variants[newValue].id!);
        }
    };

    const handleShowPhotos = () => {
        // Убираем ссылку на несуществующее поле photos
        console.log('Функция показа фото временно отключена');
    };

    const handleShowVideo = () => {
        // Убираем ссылку на несуществующее поле video
        console.log('Функция показа видео временно отключена');
    };

    return (
        <>
            <Grow in={true} timeout={800}>
                <Card
                    variant="outlined"
                    sx={{
                        mb: 3,
                        width: '100%',
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #FFF9C4 0%, #FFECB3 50%, #FFE082 100%)',
                        border: isSelected ? '3px solid #FFD600' : '2px solid #FFE082',
                        boxShadow: isSelected
                            ? '0 8px 32px rgba(255, 215, 0, 0.3), 0 4px 16px rgba(255, 193, 7, 0.2)'
                            : '0 4px 16px rgba(255, 193, 7, 0.15)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 40px rgba(255, 193, 7, 0.25)',
                        }
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        {/* Заголовок карточки с кнопкой выбора */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="h5"
                                    fontWeight="bold"
                                    gutterBottom
                                    sx={{
                                        color: '#FF8F00',
                                        fontFamily: 'Fredoka One, Arial, sans-serif',
                                        fontSize: '1.5rem'
                                    }}
                                >
                                    {complectation.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Chip
                                        label={`${complectation.minAge}+ лет`}
                                        size="small"
                                        sx={{
                                            background: 'linear-gradient(45deg, #4CAF50, #81C784)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            borderRadius: 2
                                        }}
                                    />
                                    {complectation.variants && (
                                        <Chip
                                            label={`${complectation.variants.length} вариантов`}
                                            size="small"
                                            sx={{
                                                background: 'linear-gradient(45deg, #FF6B9D, #FF8E53)',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                borderRadius: 2
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                            <Zoom in={true} timeout={500}>
                                <Button
                                    variant={isSelected ? 'contained' : 'outlined'}
                                    onClick={() => handleSelectionChange(complectation.id, !isSelected)}
                                    startIcon={isSelected ? <CheckCircleIcon /> : <CancelIcon />}
                                    sx={{
                                        background: isSelected
                                            ? 'linear-gradient(45deg, #4CAF50, #81C784)'
                                            : 'transparent',
                                        color: isSelected ? 'white' : '#FF8F00',
                                        border: isSelected ? 'none' : '2px solid #FF8F00',
                                        borderRadius: 3,
                                        px: 3,
                                        py: 1,
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        fontFamily: 'Fredoka One, Arial, sans-serif',
                                        textTransform: 'none',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            background: isSelected
                                                ? 'linear-gradient(45deg, #388E3C, #4CAF50)'
                                                : 'rgba(255, 143, 0, 0.1)',
                                            transform: 'scale(1.05)',
                                        }
                                    }}
                                >
                                    {isSelected ? 'Выбрано!' : 'Выбрать'}
                                </Button>
                            </Zoom>
                        </Box>

                        {/* Медиа индикаторы */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {/* Убираем ссылки на несуществующие поля */}
                            <Chip
                                label="Медиа недоступно"
                                size="small"
                                sx={{
                                    background: 'linear-gradient(45deg, #9E9E9E, #BDBDBD)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    borderRadius: 2
                                }}
                            />
                        </Box>

                        {/* Описание комплектации */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Комплектация для мастер-класса
                            </Typography>
                        </Box>

                        {/* Варианты или стандартная цена */}
                        {complectation.variants && complectation.variants.length > 0 ? (
                            <Box>
                                <Tabs
                                    value={selectedTab}
                                    onChange={handleTabChange}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    sx={{
                                        '& .MuiTab-root': {
                                            minWidth: 'auto',
                                            px: 2,
                                            py: 1,
                                            fontSize: '0.875rem',
                                            fontWeight: 'bold',
                                            color: '#FF8F00',
                                            '&.Mui-selected': {
                                                color: '#FF6F00',
                                                fontWeight: 'bold'
                                            }
                                        },
                                        '& .MuiTabs-indicator': {
                                            backgroundColor: '#FF6F00',
                                            height: 3
                                        }
                                    }}
                                >
                                    {complectation.variants.map((variant, index) => (
                                        <Tab
                                            key={variant.id || index}
                                            label={
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Typography variant="caption" fontWeight="bold">
                                                        {variant.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {variant.price} ₽
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    ))}
                                </Tabs>

                                {/* Содержимое выбранного варианта */}
                                <Box sx={{ mt: 2 }}>
                                    {complectation.variants[selectedTab] && (
                                        <Box sx={{
                                            pl: 3,
                                            borderLeft: '4px solid #4CAF50',
                                            borderRadius: 2,
                                            background: 'rgba(255, 255, 255, 0.3)',
                                            p: 2
                                        }}>
                                            <Typography
                                                variant="h6"
                                                fontWeight="bold"
                                                color="#4CAF50"
                                                sx={{ fontFamily: 'Fredoka One, Arial, sans-serif' }}
                                            >
                                                {complectation.variants[selectedTab].name} - {complectation.variants[selectedTab].price} ₽
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                Вариант комплектации
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        ) : (
                            /* Стандартная комплектация без вариантов */
                            <Box sx={{
                                pl: 3,
                                borderLeft: '4px solid #4CAF50',
                                borderRadius: 2,
                                background: 'rgba(255, 255, 255, 0.3)',
                                p: 2
                            }}>
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color="#4CAF50"
                                    sx={{ fontFamily: 'Fredoka One, Arial, sans-serif' }}
                                >
                                    Стандартная комплектация - {complectation.price} ₽
                                </Typography>
                            </Box>
                        )}

                        {/* Интерактивные иконки медиа */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
                            <Tooltip title="Показать фото">
                                <IconButton
                                    onClick={handleShowPhotos}
                                    sx={{
                                        color: '#FF8F00',
                                        '&:hover': { color: '#FF6F00' }
                                    }}
                                >
                                    <PhotoLibraryIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Показать видео">
                                <IconButton
                                    onClick={handleShowVideo}
                                    sx={{
                                        color: '#FF8F00',
                                        '&:hover': { color: '#FF6F00' }
                                    }}
                                >
                                    <PlayCircleIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </CardContent>
                </Card>
            </Grow>

            {/* Уведомления */}
            <Snackbar
                open={notification.open}
                autoHideDuration={3000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                    severity={notification.severity}
                    sx={{
                        width: '100%',
                        fontFamily: 'Fredoka One, Arial, sans-serif',
                        fontSize: '1rem',
                        borderRadius: 3,
                        '& .MuiAlert-icon': {
                            fontSize: 32
                        }
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ComplectationCard; 