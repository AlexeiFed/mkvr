/**
 * @file: OrderDetails.tsx
 * @description: Компонент для просмотра деталей заказа
 * @dependencies: react, @mui/material
 * @created: 2024-07-06
 */

import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    Divider,
    Card,
    CardContent,
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    School,
    Grade,
    Schedule,
    Brush,
    Palette,
    StickyNote2,
    AttachMoney,
    Event,
    Person,
} from '@mui/icons-material';
import type { Order } from '../../store/ordersSlice';

interface OrderDetailsProps {
    order: Order;
    onBack: () => void;
    onEdit: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onBack, onEdit }) => {
    const getStatusColor = (status: string) => {
        const statusColors = {
            pending: 'warning',
            paid: 'info',
            completed: 'success',
            cancelled: 'error',
        };
        return statusColors[status as keyof typeof statusColors] || 'default';
    };

    const getStatusLabel = (status: string) => {
        const statusLabels = {
            pending: 'Ожидает',
            paid: 'Оплачен',
            completed: 'Завершен',
            cancelled: 'Отменен',
        };
        return statusLabels[status as keyof typeof statusLabels] || status;
    };

    const getPaymentStatusColor = (status: string) => {
        const statusColors = {
            pending: 'warning',
            paid: 'success',
            refunded: 'error',
        };
        return statusColors[status as keyof typeof statusColors] || 'default';
    };

    const getPaymentStatusLabel = (status: string) => {
        const statusLabels = {
            pending: 'Ожидает оплаты',
            paid: 'Оплачен',
            refunded: 'Возврат',
        };
        return statusLabels[status as keyof typeof statusLabels] || status;
    };

    const getPenTypeLabel = (type: string) => {
        const typeLabels = {
            regular: 'Обычная',
            double: 'Двойная',
            light: 'Светящаяся',
        };
        return typeLabels[type as keyof typeof typeLabels] || type;
    };

    const getVarnishLabel = (type: string) => {
        const typeLabels = {
            regular: 'Обычный',
            sparkle: 'Блестящий',
        };
        return typeLabels[type as keyof typeof typeLabels] || type;
    };

    const getShiftLabel = (shift: string) => {
        const shiftLabels = {
            morning: 'Утренняя',
            afternoon: 'Дневная',
            evening: 'Вечерняя',
        };
        return shiftLabels[shift as keyof typeof shiftLabels] || shift;
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                {/* Заголовок */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={onBack}
                        >
                            Назад
                        </Button>
                        <Typography variant="h4" component="h1">
                            Заказ #{order.id}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={onEdit}
                    >
                        Редактировать
                    </Button>
                </Box>

                {/* Статусы */}
                <Box display="flex" gap={2} mb={3}>
                    <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status) as 'warning' | 'info' | 'success' | 'error' | 'default'}
                        size="medium"
                    />
                    <Chip
                        label={getPaymentStatusLabel(order.paymentStatus)}
                        color={getPaymentStatusColor(order.paymentStatus) as 'warning' | 'success' | 'error' | 'default'}
                        size="medium"
                    />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Основная информация */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Основная информация
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <School color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Школа
                                            </Typography>
                                            <Typography variant="body1">
                                                {order.school}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Grade color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Класс
                                            </Typography>
                                            <Typography variant="body1">
                                                {order.grade}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Schedule color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Смена
                                            </Typography>
                                            <Typography variant="body1">
                                                {getShiftLabel(order.shift)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Event color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Дата мастер-класса
                                            </Typography>
                                            <Typography variant="body1">
                                                {new Date(order.workshopDate).toLocaleDateString('ru-RU')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>

                        {/* Детали заказа */}
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Детали заказа
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Brush color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Тип ручки
                                            </Typography>
                                            <Typography variant="body1">
                                                {getPenTypeLabel(order.penType)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Palette color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Тип лака
                                            </Typography>
                                            <Typography variant="body1">
                                                {getVarnishLabel(order.varnish)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <StickyNote2 color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Наклейки
                                            </Typography>
                                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                {order.stickers.length > 0 ? (
                                                    order.stickers.map((sticker) => (
                                                        <Chip key={sticker} label={sticker} size="small" />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Не выбраны
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {order.personalInscription && (
                                        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                                            <StickyNote2 color="primary" />
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Персональная надпись
                                                </Typography>
                                                <Typography variant="body1">
                                                    {order.personalInscription}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    <Box display="flex" alignItems="center" gap={2}>
                                        <AttachMoney color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Сумма
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                {order.amount} ₽
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>

                    {/* Информация о пользователях */}
                    {(order.child || order.parent) && (
                        <Box>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Информация о пользователях
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        {order.child && (
                                            <Box sx={{ flex: 1, minWidth: 300 }}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Person color="primary" />
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Ребенок
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {order.child.firstName} {order.child.lastName}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {order.child.email}
                                                        </Typography>
                                                        {order.child.age && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                Возраст: {order.child.age} лет
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}

                                        {order.parent && (
                                            <Box sx={{ flex: 1, minWidth: 300 }}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Person color="primary" />
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Родитель
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {order.parent.firstName} {order.parent.lastName}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {order.parent.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {/* Комплектующие */}
                    {order.orderComplectations && order.orderComplectations.length > 0 && (
                        <Card sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Выбранные комплектующие
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {order.orderComplectations.map((orderComp) => (
                                        <Box key={orderComp.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="body1">
                                                    {orderComp.subService.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Количество: {orderComp.quantity}
                                                </Typography>
                                                {orderComp.subService.minAge > 0 && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        От {orderComp.subService.minAge} лет
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Typography variant="body1" fontWeight="bold">
                                                {orderComp.price} ₽
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* Даты */}
                    <Box>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Даты
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ flex: 1, minWidth: 300 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Дата создания
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(order.createdAt).toLocaleString('ru-RU')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 300 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Последнее обновление
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(order.updatedAt).toLocaleString('ru-RU')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default OrderDetails; 