/**
 * @file: OrdersList.tsx
 * @description: Компонент для отображения списка заказов
 * @dependencies: react, react-redux, @mui/material
 * @created: 2024-07-06
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    CircularProgress,
    Alert,
    Fab,
} from '@mui/material';
import {
    Visibility,
    Edit,
    Delete,
    Add,
} from '@mui/icons-material';
import { fetchOrders, deleteOrder } from '../../store/ordersSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Order } from '../../store/ordersSlice';

interface OrdersListProps {
    onViewOrder: (order: Order) => void;
    onEditOrder: (order: Order) => void;
    onCreateOrder: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({
    onViewOrder,
    onEditOrder,
    onCreateOrder,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { orders, isLoading, error } = useSelector((state: RootState) => state.orders);
    const { user } = useSelector((state: RootState) => state.auth);
    const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

    useEffect(() => {
        dispatch(fetchOrders());
    }, [dispatch]);

    const handleDeleteOrder = async (orderId: number) => {
        if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
            setDeletingOrderId(orderId);
            try {
                await dispatch(deleteOrder(orderId));
            } finally {
                setDeletingOrderId(null);
            }
        }
    };

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

    const canEditOrder = (order: Order) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.role === 'parent' && order.parentId === user.id) return true;
        return false;
    };

    const canDeleteOrder = (order: Order) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.role === 'parent' && order.parentId === user.id && order.status === 'pending') return true;
        return false;
    };

    if (isLoading && orders.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Заказы
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={onCreateOrder}
                >
                    Создать заказ
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {orders.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Заказы не найдены
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Создайте первый заказ, чтобы начать работу
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Школа</TableCell>
                                <TableCell>Класс</TableCell>
                                <TableCell>Смена</TableCell>
                                <TableCell>Тип ручки</TableCell>
                                <TableCell>Лак</TableCell>
                                <TableCell>Сумма</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>Оплата</TableCell>
                                <TableCell>Дата мастер-класса</TableCell>
                                <TableCell>Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id} hover>
                                    <TableCell>{order.id}</TableCell>
                                    <TableCell>{order.school}</TableCell>
                                    <TableCell>{order.grade}</TableCell>
                                    <TableCell>{order.shift}</TableCell>
                                    <TableCell>
                                        {order.penType === 'regular' && 'Обычная'}
                                        {order.penType === 'double' && 'Двойная'}
                                        {order.penType === 'light' && 'Светящаяся'}
                                    </TableCell>
                                    <TableCell>
                                        {order.varnish === 'regular' && 'Обычный'}
                                        {order.varnish === 'sparkle' && 'Блестящий'}
                                    </TableCell>
                                    <TableCell>{order.amount} ₽</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getStatusLabel(order.status)}
                                            color={getStatusColor(order.status) as 'warning' | 'info' | 'success' | 'error' | 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getPaymentStatusLabel(order.paymentStatus)}
                                            color={getPaymentStatusColor(order.paymentStatus) as 'warning' | 'success' | 'error' | 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(order.workshopDate).toLocaleDateString('ru-RU')}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => onViewOrder(order)}
                                                title="Просмотр"
                                            >
                                                <Visibility />
                                            </IconButton>
                                            {canEditOrder(order) && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onEditOrder(order)}
                                                    title="Редактировать"
                                                >
                                                    <Edit />
                                                </IconButton>
                                            )}
                                            {canDeleteOrder(order) && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    disabled={deletingOrderId === order.id}
                                                    title="Удалить"
                                                    color="error"
                                                >
                                                    {deletingOrderId === order.id ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        <Delete />
                                                    )}
                                                </IconButton>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Floating Action Button для создания заказа */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                }}
                onClick={onCreateOrder}
            >
                <Add />
            </Fab>
        </Box>
    );
};

export default OrdersList; 