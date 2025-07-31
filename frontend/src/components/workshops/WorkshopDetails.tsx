/**
 * @file: WorkshopDetails.tsx
 * @description: Детальная страница мастер-класса с управлением оплатой
 * @dependencies: React, MUI, Redux, React Router
 * @created: 2024-12-19
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Button,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Payment as PaymentIcon, Check as CheckIcon } from '@mui/icons-material';
import type { RootState, AppDispatch } from '../../store';
import { fetchWorkshopById, updateWorkshopPayment } from '../../store/workshopsSlice';
import type { WorkshopOrder } from '../../types';
import { io as socketIOClient, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

// Новая структура для двухуровневого заголовка
interface GroupedHeader {
    complectationId: number;
    name: string;
    variants: Array<{ id: number; name: string }>;
    hasVariants: boolean;
}

const WorkshopDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { currentWorkshop, loading, error } = useSelector((state: RootState) => state.workshops);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<WorkshopOrder | null>(null);
    const [paymentData, setPaymentData] = useState({
        paymentStatus: 'pending',
        amount: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        executor: '',
        phone: '',
        notes: ''
    });

    // Парсим данные из notes при загрузке
    useEffect(() => {
        if (currentWorkshop?.notes) {
            try {
                const parsedNotes = JSON.parse(currentWorkshop.notes);
                setEditData({
                    executor: parsedNotes.executor || '',
                    phone: parsedNotes.phone || '',
                    notes: parsedNotes.notes || ''
                });
            } catch {
                // Если notes не является JSON, используем как обычный текст
                setEditData({
                    executor: currentWorkshop.executor ? `${currentWorkshop.executor.firstName} ${currentWorkshop.executor.lastName}` : '',
                    phone: '',
                    notes: currentWorkshop.notes || ''
                });
            }
        } else {
            setEditData({
                executor: currentWorkshop?.executor ? `${currentWorkshop.executor.firstName} ${currentWorkshop.executor.lastName}` : '',
                phone: '',
                notes: ''
            });
        }
    }, [currentWorkshop]);

    // Формируем структуру для двухуровневого заголовка
    const groupedHeaders: GroupedHeader[] = React.useMemo(() => {
        if (!currentWorkshop?.service?.subServices) return [];

        try {
            // Создаем глубокую копию массива для безопасной сортировки
            const subServicesCopy = JSON.parse(JSON.stringify(currentWorkshop.service.subServices));

            return subServicesCopy
                .sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0)) // Сортируем по полю order
                .map((sub: { id: number; name: string; hasVariants?: boolean; variants?: Array<{ id: number; name: string }> }) => ({
                    complectationId: sub.id,
                    name: sub.name,
                    variants: sub.hasVariants && sub.variants && sub.variants.length > 0
                        ? sub.variants.map((v: { id: number; name: string }) => ({ id: v.id, name: v.name }))
                        : [{ id: 0, name: sub.name }],
                    hasVariants: !!sub.hasVariants && !!sub.variants && sub.variants.length > 0
                }));
        } catch (error) {
            console.error('Ошибка при формировании заголовков таблицы:', error);
            return [];
        }
    }, [currentWorkshop]);

    // Для рендера ячеек
    const getCellSelected = (order: WorkshopOrder, complectationId: number, variantId: number, hasVariants: boolean) => {
        const comp = order.orderComplectations?.find(c => c.subServiceId === complectationId);
        if (!comp) return false;

        // Отладочная информация
        console.log('getCellSelected:', {
            orderId: order.id,
            complectationId,
            variantId,
            hasVariants,
            compVariantId: comp.variantId,
            orderComplectations: order.orderComplectations
        });

        if (hasVariants) {
            // Для комплектаций с вариантами проверяем конкретный вариант
            return comp.variantId === variantId;
        } else {
            // Для комплектаций без вариантов показываем галочку в первой ячейке (variantId = 0)
            return variantId === 0;
        }
    };

    useEffect(() => {
        if (id) {
            dispatch(fetchWorkshopById(id));
        }
    }, [dispatch, id]);

    // Отдельный useEffect для WebSocket
    useEffect(() => {
        // Подписка на WebSocket для live-обновления
        const socket: Socket = socketIOClient(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true
        });

        const handleWorkshopUpdate = (payload: { workshopId: number }) => {
            if (id && Number(id) === payload.workshopId) {
                dispatch(fetchWorkshopById(id));
            }
        };

        const handleOrderCancelled = (payload: { workshopId: number }) => {
            if (id && Number(id) === payload.workshopId) {
                dispatch(fetchWorkshopById(id));
            }
        };

        socket.on('workshop:updated', handleWorkshopUpdate);
        socket.on('order:cancelled', handleOrderCancelled);

        return () => {
            socket.off('workshop:updated', handleWorkshopUpdate);
            socket.off('order:cancelled', handleOrderCancelled);
            // Не отключаем сокет, только убираем слушатели
        };
    }, [dispatch, id]);

    const handlePaymentUpdate = async () => {
        if (selectedOrder && id) {
            try {
                await dispatch(updateWorkshopPayment({
                    workshopId: id,
                    childId: selectedOrder.childId.toString(),
                    isPaid: paymentData.paymentStatus === 'paid'
                })).unwrap();
                setShowPaymentDialog(false);
                setSelectedOrder(null);
                // Обновляем данные мастер-класса
                dispatch(fetchWorkshopById(id));
            } catch (error) {
                console.error('Ошибка обновления оплаты:', error);
            }
        }
    };

    const openPaymentDialog = (order: WorkshopOrder) => {
        setSelectedOrder(order);
        setPaymentData({
            paymentStatus: order.paymentStatus,
            amount: order.amount
        });
        setShowPaymentDialog(true);
    };

    const handleEditSave = async () => {
        if (!id) return;

        try {
            const response = await fetch(`http://localhost:3001/api/workshops/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    executor: editData.executor,
                    phone: editData.phone,
                    notes: editData.notes
                })
            });

            if (response.ok) {
                setIsEditing(false);
                dispatch(fetchWorkshopById(id));
            }
        } catch (error) {
            console.error('Ошибка обновления мастер-класса:', error);
        }
    };

    // Статистика по комплектациям с вариантами
    const getComplectationStats = () => {
        if (!currentWorkshop?.orders) return {};

        const stats: { [key: string]: { total: number; variants: { [variantName: string]: number } } } = {};

        currentWorkshop.orders.forEach(order => {
            order.orderComplectations?.forEach(comp => {
                const serviceName = comp.subService.name;

                if (!stats[serviceName]) {
                    stats[serviceName] = { total: 0, variants: {} };
                }

                stats[serviceName].total += comp.quantity;

                // Если есть вариант, добавляем его в статистику
                if (comp.variant) {
                    const variantName = comp.variant.name;
                    stats[serviceName].variants[variantName] = (stats[serviceName].variants[variantName] || 0) + comp.quantity;
                } else {
                    // Если варианта нет, считаем как "обычная"
                    stats[serviceName].variants['обычная'] = (stats[serviceName].variants['обычная'] || 0) + comp.quantity;
                }
            });
        });

        return stats;
    };

    const getStatusColor = (status: string): 'primary' | 'warning' | 'success' | 'error' | 'default' => {
        switch (status) {
            case 'scheduled': return 'primary';
            case 'in-progress': return 'warning';
            case 'completed': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'scheduled': return 'Запланирован';
            case 'in-progress': return 'В процессе';
            case 'completed': return 'Завершен';
            case 'cancelled': return 'Отменен';
            default: return status;
        }
    };

    const getPaymentStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
        switch (status) {
            case 'paid': return 'success';
            case 'pending': return 'warning';
            case 'refunded': return 'error';
            default: return 'default';
        }
    };

    const getPaymentStatusText = (status: string) => {
        switch (status) {
            case 'paid': return 'Оплачено';
            case 'pending': return 'Ожидает оплаты';
            case 'refunded': return 'Возврат';
            default: return status;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!currentWorkshop) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">Мастер-класс не найден</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/workshops')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
            </Box>

            {/* Информация о мастер-классе */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Информация о мастер-классе</Typography>
                    <Button
                        variant="outlined"
                        onClick={() => setIsEditing(!isEditing)}
                        size="small"
                    >
                        {isEditing ? 'Отменить' : 'Редактировать'}
                    </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Дата</Typography>
                        <Typography variant="body1">
                            {new Date(currentWorkshop.date).toLocaleDateString('ru-RU')}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Время</Typography>
                        <Typography variant="body1">{currentWorkshop.time}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Школа</Typography>
                        <Typography variant="body1">{currentWorkshop.school?.name || 'Не указана'}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Класс</Typography>
                        <Typography variant="body1">{currentWorkshop.class?.name || 'Не указан'}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Преподаватель</Typography>
                        {isEditing ? (
                            <TextField
                                fullWidth
                                size="small"
                                value={editData.executor}
                                onChange={(e) => setEditData(prev => ({ ...prev, executor: e.target.value }))}
                            />
                        ) : (
                            <Typography variant="body1">
                                {editData.executor || currentWorkshop.class?.teacher || (currentWorkshop.executor ? `${currentWorkshop.executor.firstName} ${currentWorkshop.executor.lastName}` : 'Не указан')}
                            </Typography>
                        )}
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Телефон</Typography>
                        {isEditing ? (
                            <TextField
                                fullWidth
                                size="small"
                                value={editData.phone}
                                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                        ) : (
                            <Typography variant="body1">
                                {editData.phone || currentWorkshop.class?.phone || 'Не указан'}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                        <Typography variant="body2" color="text.secondary">Примечание</Typography>
                        {isEditing ? (
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={editData.notes}
                                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        ) : (
                            <Typography variant="body1">
                                {editData.notes || 'Нет примечаний'}
                            </Typography>
                        )}
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Статус</Typography>
                        <Chip
                            label={getStatusText(currentWorkshop.status)}
                            color={getStatusColor(currentWorkshop.status)}
                            size="small"
                        />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Участники</Typography>
                        <Typography variant="body1">
                            {currentWorkshop.currentParticipants}
                        </Typography>
                    </Box>
                </Box>
                {isEditing && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button variant="contained" onClick={handleEditSave} size="small">
                            Сохранить
                        </Button>
                        <Button variant="outlined" onClick={() => setIsEditing(false)} size="small">
                            Отменить
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Статистика */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Статистика</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                            {currentWorkshop.totalParticipants || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Всего участников
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                            {currentWorkshop.paidParticipants || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Оплативших
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                            {currentWorkshop.totalAmount || 0} ₽
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Общая сумма
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main">
                            {currentWorkshop.paidAmount || 0} ₽
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Оплачено
                        </Typography>
                    </Box>
                </Box>

                {/* Статистика по комплектациям */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Статистика по комплектациям</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(250px, 1fr))' }, gap: 2 }}>
                    {Object.entries(getComplectationStats()).map(([name, data]) => (
                        <Box key={name} sx={{
                            textAlign: 'center',
                            p: 3,
                            border: '2px solid #e3f2fd',
                            borderRadius: 2,
                            backgroundColor: '#f8f9fa',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {data.total}
                            </Typography>
                            <Typography variant="h6" color="text.primary" sx={{ mb: 2, fontWeight: 'medium' }}>
                                {name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {Object.entries(data.variants).map(([variantName, count]) => (
                                    <Box key={variantName} sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 1,
                                        backgroundColor: 'white',
                                        borderRadius: 1,
                                        border: '1px solid #e0e0e0'
                                    }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {variantName}
                                        </Typography>
                                        <Chip
                                            label={count}
                                            size="small"
                                            color="secondary"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Paper>

            {/* Список участников */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Участники</Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            {/* Первая строка: комплектации */}
                            <TableRow>
                                <TableCell rowSpan={2}>Ребенок</TableCell>
                                {groupedHeaders.map(header => (
                                    <TableCell
                                        key={header.complectationId}
                                        align="center"
                                        colSpan={header.variants.length}
                                        sx={{ fontWeight: 'bold', fontSize: 14 }}
                                    >
                                        {header.name}
                                    </TableCell>
                                ))}
                                <TableCell rowSpan={2}>Сумма</TableCell>
                                <TableCell rowSpan={2}>Статус оплаты</TableCell>
                                <TableCell rowSpan={2}>Действия</TableCell>
                            </TableRow>
                            {/* Вторая строка: варианты */}
                            <TableRow>
                                {groupedHeaders.map(header => (
                                    header.variants.map(variant => (
                                        <TableCell key={header.complectationId + '-' + variant.id} align="center" sx={{ fontSize: 13 }}>
                                            {header.hasVariants ? variant.name : ''}
                                        </TableCell>
                                    ))
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(currentWorkshop.orders || []).map((order: WorkshopOrder) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {order.child.firstName} {order.child.lastName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Возраст: {order.child.age} лет
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    {groupedHeaders.map(header => (
                                        header.variants.map(variant => (
                                            <TableCell key={header.complectationId + '-' + variant.id} align="center">
                                                {getCellSelected(order, header.complectationId, variant.id, header.hasVariants) ? (
                                                    <CheckIcon color="success" sx={{ fontSize: 20 }} />
                                                ) : null}
                                            </TableCell>
                                        ))
                                    ))}
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {order.amount} ₽
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getPaymentStatusText(order.paymentStatus)}
                                            color={getPaymentStatusColor(order.paymentStatus)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() => openPaymentDialog(order)}
                                            color="primary"
                                            size="small"
                                        >
                                            <PaymentIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Диалог обновления оплаты */}
            <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Обновить статус оплаты</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Статус оплаты</InputLabel>
                            <Select
                                value={paymentData.paymentStatus}
                                label="Статус оплаты"
                                onChange={(e) => setPaymentData(prev => ({ ...prev, paymentStatus: (e.target as HTMLInputElement).value }))}
                            >
                                <MenuItem value="pending">Ожидает оплаты</MenuItem>
                                <MenuItem value="paid">Оплачено</MenuItem>
                                <MenuItem value="refunded">Возврат</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            type="number"
                            label="Сумма"
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            InputProps={{
                                endAdornment: <Typography variant="body2">₽</Typography>
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPaymentDialog(false)}>Отмена</Button>
                    <Button onClick={handlePaymentUpdate} variant="contained">
                        Обновить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WorkshopDetails; 