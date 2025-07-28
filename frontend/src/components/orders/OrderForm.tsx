/**
 * @file: OrderForm.tsx
 * @description: Компонент формы создания и редактирования заказа
 * @dependencies: react, react-redux, react-hook-form, @mui/material
 * @created: 2024-07-06
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
    Box,
    Button,
    Card,
    Typography,
    TextField,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import type { AppDispatch, RootState } from '../../store';
import { fetchServices } from '../../store/servicesSlice';
import { createOrder, updateOrder, clearError } from '../../store/ordersSlice';
import type { Order, CreateOrderData, UpdateOrderData } from '../../store/ordersSlice';
import { fetchSubServices } from '../../store/subServicesSlice';
import type { Child } from '../../store/authSlice';
import ComplectationCard from './ComplectationCard';

interface OrderFormProps {
    order?: Order;
    onCancel: () => void;
    onSuccess: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ order, onCancel, onSuccess }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error } = useSelector((state: RootState) => state.orders);
    const { user, children } = useSelector((state: RootState) => state.auth);
    const { subServices } = useSelector((state: RootState) => state.subServices);

    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [selectedComplectations, setSelectedComplectations] = useState<number[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<{ [complectationId: number]: number }>({});

    const isEditing = !!order;

    // Загружаем детей и комплектующие при монтировании компонента
    useEffect(() => {
        dispatch(fetchServices());
        dispatch(fetchSubServices());
    }, [dispatch]);

    // Фильтруем комплектующие по возрасту выбранного ребёнка
    const availableComplectations = selectedChild
        ? subServices.filter(comp => comp.minAge <= selectedChild.age)
        : subServices;

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CreateOrderData>({
        defaultValues: {
            childId: order?.childId || user?.id || 0,
            parentId: order?.parentId || user?.id || 0,
            workshopId: order?.workshopId || 0,
            notes: order?.notes || '',
            selectedComplectations: [],
        },
    });

    const watchedChildId = watch('childId');

    // Обновляем выбранного ребёнка при изменении childId
    useEffect(() => {
        if (watchedChildId && children.length > 0) {
            const child = children.find(c => c.id === watchedChildId);
            setSelectedChild(child || null);
        }
    }, [watchedChildId, children]);

    const onSubmit = async (data: CreateOrderData) => {
        dispatch(clearError());

        // Добавляем выбранные комплектующие к данным заказа
        const orderData: CreateOrderData = {
            childId: selectedChild!.id,
            parentId: user!.id, // Assuming user is the parent for now
            workshopId: Number(data.workshopId),
            selectedComplectations: selectedComplectations.map(complectationId => {
                return {
                    subServiceId: complectationId,
                    variantId: selectedVariants[complectationId] || undefined
                };
            }),
            notes: data.notes || '',
        };

        if (isEditing && order) {
            const updateData: UpdateOrderData = {
                id: order.id,
                ...orderData,
            };
            await dispatch(updateOrder(updateData));
        } else {
            await dispatch(createOrder(orderData));
        }

        onSuccess();
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                padding: 3,
            }}
        >
            <Card
                elevation={3}
                sx={{
                    padding: 4,
                    width: '100%',
                    maxWidth: 800,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    {isEditing ? 'Редактирование заказа' : 'Создание заказа'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Основная информация */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Основная информация
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: 1, minWidth: 300 }}>
                                <Controller
                                    name="childId"
                                    control={control}
                                    rules={{ required: 'Выбор ребёнка обязателен' }}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.childId}>
                                            <InputLabel>Ребёнок</InputLabel>
                                            <Select {...field} label="Ребёнок" disabled={isLoading}>
                                                {children.map((child) => (
                                                    <MenuItem key={child.id} value={child.id}>
                                                        {child.firstName} {child.lastName} ({child.age} лет)
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 300 }}>
                                <Controller
                                    name="workshopId"
                                    control={control}
                                    rules={{ required: 'Выбор мастер-класса обязателен' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            type="number"
                                            label="ID мастер-класса"
                                            error={!!errors.workshopId}
                                            helperText={errors.workshopId?.message}
                                            disabled={isLoading}
                                        />
                                    )}
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Заметки к заказу"
                                        multiline
                                        rows={3}
                                        disabled={isLoading}
                                        helperText="Необязательно"
                                    />
                                )}
                            />
                        </Box>

                        {/* Выбор комплектующих */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Выбор комплектующих
                            </Typography>
                            {selectedChild && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Доступные комплектующие для возраста {selectedChild.age} лет:
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {availableComplectations.map((complectation) => (
                                    <ComplectationCard
                                        key={complectation.id}
                                        complectation={complectation}
                                        selectedComplectations={selectedComplectations}
                                        setSelectedComplectations={setSelectedComplectations}
                                        setSelectedVariants={setSelectedVariants}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={onCancel}
                            disabled={isLoading}
                            size="large"
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                            size="large"
                        >
                            {isLoading ? (
                                <CircularProgress size={24} />
                            ) : isEditing ? (
                                'Сохранить изменения'
                            ) : (
                                'Создать заказ'
                            )}
                        </Button>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};

export default OrderForm; 