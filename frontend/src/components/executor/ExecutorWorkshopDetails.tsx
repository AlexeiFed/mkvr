/**
 * @file: ExecutorWorkshopDetails.tsx
 * @description: Детальная страница мастер-класса для исполнителей
 * @dependencies: React, MUI, API services
 * @created: 2025-01-29
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    List,
    ListItem,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
    useMediaQuery,
    Divider
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
    School as SchoolIcon,
    Group as GroupIcon,
    Person as PersonIcon,
    Edit as EditIcon,
    Phone as PhoneIcon,
    Payment as PaymentIcon,
    People as PeopleIcon,
    AccountCircle as AccountIcon,
    ExitToApp as LogoutIcon,
    AttachMoney as CashIcon
} from '@mui/icons-material';
import { api } from '../../services/api';
import type { Workshop, WorkshopOrder } from '../../types';

interface ExecutorWorkshopDetailsProps {
    isExecutor?: boolean;
}

const ExecutorWorkshopDetails: React.FC<ExecutorWorkshopDetailsProps> = ({ isExecutor = true }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (id) {
            loadWorkshop();
        }
    }, [id]);

    const loadWorkshop = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/workshops/${id}`);
            // API возвращает { success: true, workshop: data }
            const workshopData = response.data.success ? response.data.workshop : response.data;
            setWorkshop(workshopData);
        } catch (error) {
            console.error('Ошибка загрузки мастер-класса:', error);
            setError('Не удалось загрузить данные мастер-класса');
        } finally {
            setLoading(false);
        }
    };

    // Убраны функции статусов, так как статус больше не отображается

    const getPaymentStatusColor = (status: string) => {
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

    // Функция для подсчета статистики по комплектациям
    const getComplectationStats = () => {
        if (!workshop?.orders) return {};

        const stats: { [key: string]: { [variantId: number]: number } } = {};

        workshop.orders.forEach(order => {
            order.orderComplectations?.forEach(comp => {
                const subServiceName = comp.subService?.name || 'Неизвестно';
                const variantId = comp.variantId || 0;

                if (!stats[subServiceName]) {
                    stats[subServiceName] = {};
                }
                if (!stats[subServiceName][variantId]) {
                    stats[subServiceName][variantId] = 0;
                }
                stats[subServiceName][variantId]++;
            });
        });

        return stats;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !workshop) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    {error || 'Мастер-класс не найден'}
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            {/* Синяя шапка */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <IconButton
                    onClick={() => navigate(-1)}
                    sx={{ color: 'white' }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" component="h1" sx={{ flex: 1, textAlign: 'center' }}>
                    {workshop.service?.name || 'Мастер-класс'}
                </Typography>
                <IconButton size="small" sx={{ color: 'white' }}>
                    <AccountIcon />
                </IconButton>
                <IconButton size="small" sx={{ color: 'white' }}>
                    <LogoutIcon />
                </IconButton>
            </Box>

            <Box p={isMobile ? 2 : 3}>

                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                    {/* Основная информация */}
                    <Box flex={2}>
                        {/* Основная информация - компактная для мобильных */}
                        <Paper sx={{ p: isMobile ? 2 : 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Основная информация
                            </Typography>
                            {isMobile ? (
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {/* Строка 1: Дата и время */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <CalendarIcon color="primary" sx={{ fontSize: 20 }} />
                                            <Typography variant="body2">
                                                {new Date(workshop.date).toLocaleDateString('ru-RU')}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <TimeIcon color="primary" sx={{ fontSize: 20 }} />
                                            <Typography variant="body2">
                                                {workshop.time}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Строка 2: Школа и класс */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <SchoolIcon color="primary" sx={{ fontSize: 20 }} />
                                            <Typography variant="body2">
                                                {workshop.school?.name || 'Школа не указана'}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <GroupIcon color="primary" sx={{ fontSize: 20 }} />
                                            <Typography variant="body2">
                                                {workshop.class?.name || 'Не указан'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Строка 3: Преподаватель и телефон */}
                                    {(workshop.class?.teacher || workshop.class?.phone) && (
                                        <Box display="flex" alignItems="center" gap={2}>
                                            {workshop.class?.teacher && (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <PersonIcon color="primary" sx={{ fontSize: 20 }} />
                                                    <Typography variant="body2">
                                                        {workshop.class.teacher}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {workshop.class?.phone && (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <PhoneIcon color="primary" sx={{ fontSize: 20 }} />
                                                    <Typography variant="body2">
                                                        {workshop.class.phone}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {/* Строка 4: Примечания */}
                                    {workshop.notes && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {workshop.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography>
                                                {new Date(workshop.date).toLocaleDateString('ru-RU')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <TimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography>
                                                {workshop.time}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography>
                                                {workshop.school?.name || 'Школа не указана'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography>
                                                Класс: {workshop.class?.name || 'Не указан'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Paper>

                        {/* Статистика - компактная для мобильных */}
                        <Paper sx={{ p: isMobile ? 2 : 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Статистика
                            </Typography>
                            {isMobile ? (
                                <Box display="flex" gap={2}>
                                    <Card variant="outlined" sx={{ textAlign: 'center', flex: 1 }}>
                                        <CardContent sx={{ py: 2 }}>
                                            <PeopleIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                                            <Typography variant="h4" color="primary">
                                                {workshop.totalParticipants || 0}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Записано
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    <Card variant="outlined" sx={{ textAlign: 'center', flex: 1 }}>
                                        <CardContent sx={{ py: 2 }}>
                                            <PaymentIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                                            <Typography variant="h4" color="success.main">
                                                {workshop.paidParticipants || 0}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Оплатили
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    <Card variant="outlined" sx={{ textAlign: 'center', flex: 1 }}>
                                        <CardContent sx={{ py: 2 }}>
                                            <Typography variant="h4" color="info.main">
                                                {workshop.paidAmount || 0} ₽
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Сумма
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Box>
                            ) : (
                                <Box display="flex" gap={2}>
                                    <Card variant="outlined" sx={{ flex: 1 }}>
                                        <CardContent>
                                            <Typography variant="h4" color="primary" gutterBottom>
                                                {workshop.totalParticipants || 0}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Записано детей
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    <Card variant="outlined" sx={{ flex: 1 }}>
                                        <CardContent>
                                            <Typography variant="h4" color="success.main" gutterBottom>
                                                {workshop.paidParticipants || 0}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Оплатили
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    <Card variant="outlined" sx={{ flex: 1 }}>
                                        <CardContent>
                                            <Typography variant="h4" color="info.main" gutterBottom>
                                                {workshop.paidAmount || 0} ₽
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Сумма оплат
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Box>
                            )}
                        </Paper>

                        {/* Статистика по комплектациям */}
                        {(() => {
                            const complectationStats = getComplectationStats();
                            const hasStats = Object.keys(complectationStats).length > 0;

                            if (!hasStats) return null;

                            return (
                                <Paper sx={{ p: isMobile ? 2 : 3, mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Статистика по комплектациям
                                    </Typography>
                                    {Object.entries(complectationStats).map(([subServiceName, variants]) => {
                                        const totalCount = Object.values(variants).reduce((sum, count) => sum + count, 0);

                                        return (
                                            <Box key={subServiceName} mb={2}>
                                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                    {subServiceName} (всего: {totalCount})
                                                </Typography>
                                                <Box display="flex" flexDirection="column" gap={1}>
                                                    {Object.entries(variants).map(([variantId, count]) => {
                                                        // Находим название варианта
                                                        const variant = workshop?.service?.subServices
                                                            ?.find(sub => sub.name === subServiceName)
                                                            ?.variants?.find(v => v.id === parseInt(variantId));

                                                        return (
                                                            <Box key={variantId} display="flex" justifyContent="space-between" alignItems="center">
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {variant?.name || `Вариант ${variantId}`}
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {count}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Paper>
                            );
                        })()}

                        {/* Список участников - компактный для мобильных */}
                        <Paper sx={{ p: isMobile ? 2 : 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Участники мастер-класса
                            </Typography>
                            {(workshop.orders || []).length > 0 ? (
                                isMobile ? (
                                    <List>
                                        {(workshop.orders || []).map((order: WorkshopOrder, index: number) => (
                                            <React.Fragment key={order.id}>
                                                <ListItem sx={{ px: 0, py: 2 }}>
                                                    <Box width="100%">
                                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                            <Box>
                                                                <Typography variant="subtitle1" fontWeight="bold">
                                                                    {order.child.firstName} {order.child.lastName}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {order.child.age} лет • {order.parent.firstName} {order.parent.lastName}
                                                                </Typography>
                                                            </Box>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                {order.paymentStatus === 'pending' && (
                                                                    <CashIcon color="warning" sx={{ fontSize: 20 }} />
                                                                )}
                                                                <Chip
                                                                    label={getPaymentStatusText(order.paymentStatus)}
                                                                    color={getPaymentStatusColor(order.paymentStatus) as 'success' | 'warning' | 'error' | 'default'}
                                                                    size="small"
                                                                />
                                                            </Box>
                                                        </Box>
                                                        {order.parent.phone && (
                                                            <Box display="flex" alignItems="center" mb={1}>
                                                                <PhoneIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                                                <Typography variant="body2">
                                                                    {order.parent.phone}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {order.orderComplectations && order.orderComplectations.length > 0 && (
                                                            <Box mb={1}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Комплектация:
                                                                </Typography>
                                                                <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                                                    {order.orderComplectations.map((comp, idx) => (
                                                                        <Chip
                                                                            key={idx}
                                                                            label={`${comp.subService?.name || 'Неизвестно'}: ${comp.variant?.name || 'Неизвестно'}`}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ fontSize: '0.7rem' }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        )}
                                                        <Typography variant="h6" color="primary" fontWeight="bold">
                                                            {order.amount} ₽
                                                        </Typography>
                                                    </Box>
                                                </ListItem>
                                                {index < (workshop.orders || []).length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Ребенок</TableCell>
                                                    <TableCell>Возраст</TableCell>
                                                    <TableCell>Родитель</TableCell>
                                                    <TableCell>Телефон</TableCell>
                                                    <TableCell>Сумма</TableCell>
                                                    <TableCell>Статус оплаты</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(workshop.orders || []).map((order: WorkshopOrder) => (
                                                    <TableRow key={order.id}>
                                                        <TableCell>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {order.child.firstName} {order.child.lastName}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {order.child.age} лет
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {order.parent.firstName} {order.parent.lastName}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {order.parent.phone || 'Не указан'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {order.amount} ₽
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={getPaymentStatusText(order.paymentStatus)}
                                                                color={getPaymentStatusColor(order.paymentStatus) as 'success' | 'warning' | 'error' | 'default'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )
                            ) : (
                                <Box textAlign="center" py={4}>
                                    <Typography variant="body2" color="text.secondary">
                                        Пока нет записанных участников
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {/* Боковая панель */}
                    <Box flex={1}>
                        {/* Действия */}
                        {isExecutor && (
                            <Paper sx={{ p: isMobile ? 2 : 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Действия
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<EditIcon />}
                                        onClick={() => navigate(`/executor/workshops/${id}/edit`)}
                                    >
                                        Редактировать
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => navigate('/executor/workshops')}
                                    >
                                        К списку мастер-классов
                                    </Button>
                                </Box>
                            </Paper>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ExecutorWorkshopDetails; 