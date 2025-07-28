/**
 * @file: ServiceDetails.tsx
 * @description: Компонент для отображения деталей услуги
 * @dependencies: react, @mui/material, react-redux
 * @created: 2024-07-06
 */

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Snackbar,
    Alert,
    IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Service } from '../../store/servicesSlice';
import type { SubService } from '../../store/subServicesSlice';
import { deleteSubService } from '../../store/subServicesSlice';
import { removeSubServiceFromService } from '../../store/actions';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import type { AppDispatch } from '../../store';
import { Photo as PhotoIcon, PlayCircle as PlayCircleIcon } from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Person as PersonIcon } from '@mui/icons-material';
import { updateSubServiceOrder } from '../../store/subServicesSlice';

// Компонент для перетаскиваемой карточки комплектации
interface SortableComplectationCardProps {
    subService: SubService;
    onEdit: (subService: SubService) => void;
    onDelete: (subService: SubService) => void;
    id: string;
}

const SortableComplectationCard: React.FC<SortableComplectationCardProps> = ({
    subService,
    onEdit,
    onDelete,
    id,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Drag область - только для контента */}
            <Card
                ref={setNodeRef}
                style={style}
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    ...(isDragging && {
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        transform: 'rotate(5deg)',
                    }),
                }}
                {...attributes}
                {...listeners}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" gutterBottom>
                            {subService.name}
                        </Typography>

                        {subService.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {subService.description}
                            </Typography>
                        )}

                        {/* Варианты комплектации */}
                        {subService.hasVariants && subService.variants && subService.variants.length > 0 ? (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Варианты:
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {subService.variants.map((variant, index) => (
                                        <Box key={variant.id || index} sx={{ p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                {variant.avatar && (
                                                    <Box
                                                        component="img"
                                                        src={variant.avatar.startsWith('http') ? variant.avatar : `http://localhost:3001${variant.avatar}`}
                                                        alt="Аватар варианта"
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            objectFit: 'cover',
                                                            borderRadius: 1,
                                                            border: '1px solid #ddd',
                                                        }}
                                                    />
                                                )}

                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="subtitle2" fontWeight="medium">
                                                            {variant.name}
                                                        </Typography>
                                                        <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                                            {variant.price} ₽
                                                        </Typography>
                                                    </Box>

                                                    {variant.description && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                            {variant.description}
                                                        </Typography>
                                                    )}

                                                    {/* Медиа файлы варианта */}
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        {variant.avatar && (
                                                            <Chip
                                                                label="Аватар"
                                                                size="small"
                                                                variant="outlined"
                                                                icon={<PersonIcon />}
                                                            />
                                                        )}
                                                        {variant.photos && variant.photos.length > 0 && (
                                                            <Chip
                                                                label={`${variant.photos.length} фото`}
                                                                size="small"
                                                                variant="outlined"
                                                                icon={<PhotoIcon />}
                                                            />
                                                        )}
                                                        {variant.videos && variant.videos.length > 0 && (
                                                            <Chip
                                                                label={`${variant.videos.length} видео`}
                                                                size="small"
                                                                variant="outlined"
                                                                icon={<PlayCircleIcon />}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Стандартная комплектация
                                </Typography>
                                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                    {subService.price} ₽
                                </Typography>
                            </Box>
                        )}

                        {/* Медиа индикаторы */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {subService.avatar && (
                                <Chip
                                    label="Аватар"
                                    size="small"
                                    variant="outlined"
                                    icon={<PersonIcon />}
                                />
                            )}
                            {subService.photos && subService.photos.length > 0 && (
                                <Chip
                                    label={`${subService.photos.length} фото`}
                                    size="small"
                                    variant="outlined"
                                    icon={<PhotoIcon />}
                                />
                            )}
                            {subService.video && (
                                <Chip
                                    label="Видео"
                                    size="small"
                                    variant="outlined"
                                    icon={<PlayCircleIcon />}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
            </Card>

            {/* Кнопки действий - вне drag области */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    zIndex: 10
                }}
            >
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('Edit button clicked for:', subService.name);
                        if (onEdit) {
                            onEdit(subService);
                        }
                    }}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        boxShadow: 2
                    }}
                >
                    <EditIcon />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('Delete button clicked for:', subService.name);
                        onDelete(subService);
                    }}
                    sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                        boxShadow: 2
                    }}
                >
                    <DeleteIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

interface ServiceDetailsProps {
    service: Service;
    onBack: () => void;
    onEdit?: () => void;
    onAddSubService?: () => void;
    onEditComplectation?: (subService: SubService) => void;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({
    service,
    onBack,
    onEdit,
    onAddSubService,
    onEditComplectation,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [localSubServices, setLocalSubServices] = useState<SubService[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [subServiceToDelete, setSubServiceToDelete] = useState<SubService | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Настройка сенсоров для drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Обработчик завершения перетаскивания
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setLocalSubServices((items) => {
                const oldIndex = items.findIndex((item) => item.id.toString() === active.id);
                const newIndex = items.findIndex((item) => item.id.toString() === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Сохраняем новый порядок на сервер
                const orders = newItems.map((item, index) => ({
                    id: item.id,
                    order: index
                }));

                dispatch(updateSubServiceOrder(orders)).catch(error => {
                    console.error('Ошибка сохранения порядка:', error);
                    // Показываем уведомление об ошибке
                    setNotification({
                        message: 'Ошибка сохранения порядка комплектаций',
                        type: 'error'
                    });
                });

                return newItems;
            });
        }
    };

    useEffect(() => {
        if (service.subServices) {
            setLocalSubServices([...service.subServices].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        }
    }, [service.subServices]);

    const handleDeleteClick = (subService: SubService) => {
        setSubServiceToDelete(subService);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (subServiceToDelete) {
            try {
                await dispatch(deleteSubService(subServiceToDelete.id)).unwrap();
                // Синхронизируем с servicesSlice
                dispatch(removeSubServiceFromService({
                    serviceId: service.id,
                    subServiceId: subServiceToDelete.id
                }));

                // Обновляем локальное состояние сразу
                setLocalSubServices(prev => prev.filter(subService => subService.id !== subServiceToDelete.id));

                // Показываем уведомление об успехе
                setNotification({
                    message: `Комплектация "${subServiceToDelete.name}" успешно удалена`,
                    type: 'success'
                });
            } catch (error) {
                console.error('Ошибка удаления комплектации:', error);

                // Показываем уведомление об ошибке
                const errorMessage = error instanceof Error ? error.message : 'Ошибка при удалении комплектации';
                setNotification({
                    message: errorMessage,
                    type: 'error'
                });
            }
        }
        setDeleteDialogOpen(false);
        setSubServiceToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSubServiceToDelete(null);
    };

    const handleNotificationClose = () => {
        setNotification(null);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                    sx={{ mr: 2 }}
                >
                    Назад
                </Button>
                <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                    Детали услуги
                </Typography>
                <Box display="flex" gap={2}>
                    {onEdit && (
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={onEdit}
                        >
                            Редактировать
                        </Button>
                    )}
                </Box>
            </Box>

            <Card>
                <CardContent>
                    <Box display="flex" gap={3} flexWrap="wrap">
                        <Box flex="1" minWidth="300px">
                            <Typography variant="h6" gutterBottom>
                                Основная информация
                            </Typography>
                            <Box mb={2}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Название
                                </Typography>
                                <Typography variant="body1">
                                    {service.name}
                                </Typography>
                            </Box>
                            <Box mb={2}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Описание
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ whiteSpace: 'pre-line' }}
                                >
                                    {service.description || 'Описание не указано'}
                                </Typography>
                            </Box>
                            <Box mb={2}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Статус
                                </Typography>
                                <Chip
                                    label={service.isActive ? 'Активна' : 'Неактивна'}
                                    color={service.isActive ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Комплектации */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    {service.subServices && service.subServices.length > 0 ? (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Комплектации ({service.subServices.length})
                                </Typography>
                                {onAddSubService && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={onAddSubService}
                                        size="small"
                                    >
                                        Добавить комплектацию
                                    </Button>
                                )}
                            </Box>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={localSubServices.map(subService => subService.id.toString())}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {localSubServices.map((subService) => (
                                        <SortableComplectationCard
                                            key={subService.id}
                                            subService={subService}
                                            onEdit={onEditComplectation || (() => { })}
                                            onDelete={handleDeleteClick}
                                            id={subService.id.toString()}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">
                                Комплектации (0)
                            </Typography>
                            {onAddSubService && (
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={onAddSubService}
                                    size="small"
                                >
                                    Добавить комплектацию
                                </Button>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Диалог подтверждения удаления */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Удалить комплектацию?</DialogTitle>
                <DialogContent>
                    {subServiceToDelete && (
                        <Typography>
                            Вы уверены, что хотите удалить комплектацию "{subServiceToDelete.name}"?
                            Это действие необратимо.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Отмена</Button>
                    <Button onClick={handleDeleteConfirm} color="error">Удалить</Button>
                </DialogActions>
            </Dialog>

            {/* Уведомление */}
            {notification && (
                <Snackbar open={!!notification} autoHideDuration={6000} onClose={handleNotificationClose}>
                    <Alert onClose={handleNotificationClose} severity={notification.type === 'success' ? 'success' : 'error'} sx={{ width: '100%' }}>
                        {notification.message}
                    </Alert>
                </Snackbar>
            )}
        </Box>
    );
};

export default ServiceDetails; 