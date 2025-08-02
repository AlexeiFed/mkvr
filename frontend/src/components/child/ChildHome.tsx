/**
 * @file: ChildHome.tsx
 * @description: Главная страница для ребёнка с отображением мастер-классов, чата и уведомлениями
 * @dependencies: React, ChildWorkshopsList, ChildWorkshopSignUp, ChatContainer
 * @created: 2024-07-12
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Snackbar,
    Alert,
    Box,
    Typography
} from '@mui/material';
import {
    Celebration as CelebrationIcon
} from '@mui/icons-material';
import ChildMenu from './ChildMenu';
import ChildWorkshopsList from './ChildWorkshopsList';
import ChildWorkshopSignUp from './ChildWorkshopSignUp';
import ChatContainer from '../chat/ChatContainer';
import type { Workshop, WorkshopOrder } from '../../types';
import type { User } from '../../store/authSlice';
import { logoutUser, updateUserProfile } from '../../store/authSlice';
import { fetchChildWorkshops } from '../../store/workshopsSlice';
import type { RootState, AppDispatch } from '../../store';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../services/api';

// Убираем хардкод localhost
// const SOCKET_URL = 'http://localhost:3001';

const ChildHome: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading, error: authError } = useSelector((state: RootState) => state.auth);
    const { workshops, loading: workshopsLoading } = useSelector((state: RootState) => state.workshops);

    const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
    const [signUpOpen, setSignUpOpen] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const [editOrder, setEditOrder] = useState<WorkshopOrder | null>(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    useEffect(() => {
        console.log('ChildHome useEffect - проверка условий:', {
            isAuthenticated,
            userExists: !!user,
            userRole: user?.role,
            userSchool: user?.school,
            userGrade: user?.grade,
            shouldLoad: isAuthenticated && user && user.role === 'CHILD' && user.school
        });

        if (isAuthenticated && user && user.role === 'CHILD' && user.school) {
            console.log('ChildHome: Загружаем мастер-классы для ребенка');
            dispatch(fetchChildWorkshops());
        } else {
            console.log('ChildHome: Условия не выполнены для загрузки мастер-классов');
        }
    }, [dispatch, isAuthenticated, user?.id, user?.school]); // Добавляем user.school в зависимости

    // Подключение к WebSocket и подписка на событие workshop:created
    useEffect(() => {
        const socket: Socket = socketIOClient(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true
        });

        socket.on('workshop:created', () => {
            // Автоматически обновляем список мастер-классов
            dispatch(fetchChildWorkshops());
        });

        socket.on('workshop:updated', () => {
            // Автоматически обновляем список мастер-классов при изменении
            dispatch(fetchChildWorkshops());
        });

        socket.on('order:cancelled', () => {
            // Автоматически обновляем список мастер-классов при отмене заказа
            dispatch(fetchChildWorkshops());
        });

        return () => {
            socket.disconnect();
        };
    }, [dispatch]);

    // Обработка результата обновления профиля
    useEffect(() => {
        if (authError) {
            setNotification({
                open: true,
                message: `Ошибка обновления профиля: ${authError}`,
                severity: 'error'
            });
        }
    }, [authError]);

    if (!isAuthenticated || !user || user.role !== 'CHILD') {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                fontFamily: '"Fredoka One", Arial, sans-serif',
                fontSize: 18,
                color: '#666'
            }}>
                {isLoading ? 'Загрузка...' : 'Доступ только для детей'}
            </Box>
        );
    }

    const handleSignUp = (workshopId: number) => {
        const workshop = workshops.find(w => w.id === workshopId);
        if (workshop) {
            setSelectedWorkshop(workshop);
            setSignUpOpen(true);
        }
    };

    const handleSignUpSuccess = () => {
        // Показываем уведомление об успешной записи
        setNotification({
            open: true,
            message: `Ура! Ты успешно записался на мастер-класс "${selectedWorkshop?.service?.name}"! 🎉`,
            severity: 'success'
        });

        // Обновляем список мастер-классов
        dispatch(fetchChildWorkshops());
    };

    const handleEditOrder = (workshop: Workshop, order: WorkshopOrder) => {
        setSelectedWorkshop(workshop);
        setEditOrder(order);
        setEditMode(true);
        setSignUpOpen(true);
    };

    const handleSignUpClose = () => {
        setSignUpOpen(false);
        setSelectedWorkshop(null);
        setEditOrder(null);
        setEditMode(false);
    };

    const handleNotificationClose = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        setNotification({
            open: true,
            message: 'Вы успешно вышли из аккаунта! 👋',
            severity: 'info'
        });
        navigate('/login');
    };

    const handleUpdateProfile = (updatedUser: Partial<User>) => {
        dispatch(updateUserProfile(updatedUser));
        setNotification({
            open: true,
            message: 'Профиль успешно обновлен! ✨',
            severity: 'success'
        });
    };

    const handleChatClick = () => {
        setShowChat(!showChat);
    };

    return (
        <>
            <ChildMenu
                currentUser={user}
                onLogout={handleLogout}
                onUpdateProfile={handleUpdateProfile}
                onChatClick={handleChatClick}
            />

            {showChat ? (
                <ChatContainer />
            ) : (
                <ChildWorkshopsList
                    workshops={workshops}
                    loading={workshopsLoading}
                    currentUser={user}
                    onSignUp={handleSignUp}
                    onEditOrder={handleEditOrder}
                />
            )}

            <ChildWorkshopSignUp
                open={signUpOpen}
                workshop={selectedWorkshop}
                currentUser={user}
                onClose={handleSignUpClose}
                onSuccess={handleSignUpSuccess}
                order={editOrder}
                editMode={editMode}
            />

            {/* Уведомления */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleNotificationClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleNotificationClose}
                    severity={notification.severity}
                    sx={{
                        width: '100%',
                        fontFamily: '"Fredoka One", Arial, sans-serif',
                        fontSize: 16,
                        '& .MuiAlert-icon': {
                            fontSize: 28
                        }
                    }}
                    icon={<CelebrationIcon />}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                            {notification.message}
                        </Typography>
                    </Box>
                </Alert>
            </Snackbar>
        </>
    );
};

export default ChildHome; 