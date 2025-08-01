/**
 * @file: ExecutorDashboard.tsx
 * @description: Главная панель исполнителя
 * @dependencies: React, MUI, API services
 * @created: 2025-01-29
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
    School as SchoolIcon,
    Group as GroupIcon,
    Notifications as NotificationsIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { api } from '../../services/api';
import { PushNotificationService } from '../../services/pushNotifications';
import { io as socketIOClient } from 'socket.io-client';
import type { WorkshopExecutor } from '../../types';

const ExecutorDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [workshopExecutors, setWorkshopExecutors] = useState<WorkshopExecutor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showNotificationDialog, setShowNotificationDialog] = useState(false);

    useEffect(() => {
        loadWorkshops();
        checkNotificationStatus();

        // Подключаемся к WebSocket для обновления данных в реальном времени
        const socket = socketIOClient('http://localhost:3001');

        socket.on('workshop:updated', () => {
            console.log('Получено обновление мастер-класса, перезагружаем данные...');
            loadWorkshops();
        });

        socket.on('connect', () => {
            console.log('WebSocket подключен для исполнителя');
        });

        socket.on('disconnect', () => {
            console.log('WebSocket отключен для исполнителя');
        });

        return () => {
            socket.off('workshop:updated');
            socket.disconnect();
        };
    }, []);

    const loadWorkshops = async () => {
        try {
            setLoading(true);
            const response = await api.get('/workshops/executor/my-workshops');
            setWorkshopExecutors(response.data);
        } catch (error) {
            console.error('Ошибка загрузки мастер-классов:', error);
            setError('Не удалось загрузить данные мастер-классов');
        } finally {
            setLoading(false);
        }
    };

    const checkNotificationStatus = async () => {
        // Проверяем сохраненное состояние в localStorage
        const savedNotificationState = localStorage.getItem('notificationPermissionAsked');

        if (savedNotificationState === 'true') {
            // Если уже спрашивали, просто проверяем статус
            await PushNotificationService.getSubscriptionStatus();
        } else {
            // Если еще не спрашивали, показываем диалог
            setShowNotificationDialog(true);
        }
    };

    const handleEnableNotifications = async () => {
        try {
            const initialized = await PushNotificationService.initialize();
            if (initialized) {
                await PushNotificationService.subscribe();

                // Сохраняем в localStorage что уже спрашивали
                localStorage.setItem('notificationPermissionAsked', 'true');
            }
        } catch (error) {
            console.error('Ошибка включения уведомлений:', error);
        } finally {
            setShowNotificationDialog(false);
        }
    };

    const handleDeclineNotifications = () => {
        // Сохраняем в localStorage что уже спрашивали
        localStorage.setItem('notificationPermissionAsked', 'true');
        setShowNotificationDialog(false);
    };

    // Убраны функции статусов, так как статус больше не отображается

    // Получаем мастер-классы из WorkshopExecutor
    const workshops = workshopExecutors.map(we => we.workshop);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Список мастер-классов */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Мои мастер-классы
                </Typography>

                {workshops.length === 0 ? (
                    <Box textAlign="center" py={4}>
                        <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            У вас пока нет назначенных мастер-классов
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ожидайте назначения от администратора
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {workshops.map((workshop, index) => (
                            <React.Fragment key={workshop.id}>
                                <ListItem
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mb: 2,
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            cursor: 'pointer'
                                        }
                                    }}
                                    onClick={() => navigate(`/executor/workshops/${workshop.id}`)}
                                >

                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            <SchoolIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Typography variant="h6">
                                                    {workshop.service?.name || 'Мастер-класс'}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                                    <Box display="flex" alignItems="center">
                                                        <CalendarIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                                        <Typography variant="body2">
                                                            {new Date(workshop.date).toLocaleDateString('ru-RU')}
                                                        </Typography>
                                                    </Box>
                                                    <Box display="flex" alignItems="center">
                                                        <TimeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                                        <Typography variant="body2">
                                                            {workshop.time}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                                    <Box display="flex" alignItems="center">
                                                        <SchoolIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                                        <Typography variant="body2">
                                                            {workshop.school?.name}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Box display="flex" alignItems="center">
                                                        <GroupIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                                        <Typography variant="body2">
                                                            Класс: {workshop.class?.name || 'Не указан'}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="primary">
                                                        {workshop.totalParticipants || 0} участников
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < workshops.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Диалог для разрешения уведомлений */}
            <Dialog
                open={showNotificationDialog}
                onClose={handleDeclineNotifications}
                aria-labelledby="notification-dialog-title"
                aria-describedby="notification-dialog-description"
            >
                <DialogTitle id="notification-dialog-title">
                    <Box display="flex" alignItems="center" gap={1}>
                        <NotificationsIcon color="primary" />
                        Уведомления
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="notification-dialog-description">
                        Разрешите получать уведомления о новых назначениях мастер-классов и изменениях в расписании.
                        Это поможет вам быть в курсе всех важных событий.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeclineNotifications} color="inherit">
                        Позже
                    </Button>
                    <Button onClick={handleEnableNotifications} variant="contained" autoFocus>
                        Разрешить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExecutorDashboard; 