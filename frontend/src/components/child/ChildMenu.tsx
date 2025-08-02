/**
 * @file: ChildMenu.tsx
 * @description: Меню для детского интерфейса с активной кнопкой профиля и чата
 * @dependencies: React, MUI, ChildProfile
 * @created: 2024-07-12
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Badge,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Home as HomeIcon,
    Person as PersonIcon,
    Chat as ChatIcon
} from '@mui/icons-material';
// import ChildProfile from './ChildProfile';
import type { User } from '../../store/authSlice';
import type { RootState } from '../../store';
import type { AppDispatch } from '../../store';
import { fetchConversations } from '../../store/chatSlice';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from '../../services/api';

interface ChildMenuProps {
    currentUser: User;
    onLogout: () => void;
    onUpdateProfile: (updatedUser: Partial<User>) => void;
    onChatClick?: () => void;
}

const ChildMenu: React.FC<ChildMenuProps> = ({
    currentUser,
    onChatClick
}) => {
    const [forceUpdate, setForceUpdate] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const dispatch = useDispatch<AppDispatch>();

    // Получаем данные чата для подсчета непрочитанных сообщений
    const { conversations, messages } = useSelector((state: RootState) => state.chat);

    // Добавляем логирование для отладки
    console.log('ChildMenu render:', {
        conversationsCount: conversations.length,
        messagesKeys: Object.keys(messages),
        currentUserId: currentUser.id
    });

    // Подсчитываем непрочитанные сообщения для ребенка
    const unreadCount = useMemo(() => {
        console.log('Пересчитываем счетчик уведомлений:', { conversations: conversations.length, messagesCount: Object.keys(messages).length, forceUpdate });
        return conversations.reduce((total, chat) => {
            const chatMessages = messages[chat.id] || [];
            const unreadInChat = chatMessages.filter(msg =>
                msg.senderId !== currentUser.id &&
                !msg.isRead
            ).length;
            console.log(`Чат ${chat.id}: ${unreadInChat} непрочитанных сообщений`);
            return total + unreadInChat;
        }, 0);
    }, [conversations, messages, currentUser.id, forceUpdate]);

    // Обновляем данные чата при монтировании и WebSocket событиях для актуального счетчика
    useEffect(() => {
        console.log('ChildMenu: компонент смонтирован, загружаем чаты');
        // Загружаем чаты при монтировании компонента
        dispatch(fetchConversations());

        // Подключаемся к WebSocket для получения обновлений в реальном времени
        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true
        });

        socket.on('chat:message', (data: { chatId: number; message: unknown }) => {
            console.log('ChildMenu: получено новое сообщение:', data);
            // При получении нового сообщения обновляем список чатов и принудительно обновляем счетчик
            dispatch(fetchConversations());
            // Загружаем сообщения для конкретного чата, где пришло сообщение
            import('../../store/chatSlice').then(({ fetchMessages }) => {
                dispatch(fetchMessages(data.chatId));
            });
            setForceUpdate(prev => prev + 1);
        });

        socket.on('chat:updated', () => {
            console.log('ChildMenu: чат обновлен');
            // При обновлении чата обновляем список и принудительно обновляем счетчик
            dispatch(fetchConversations());
            setForceUpdate(prev => prev + 1);
        });

        // Обновляем при фокусе окна (когда пользователь возвращается на вкладку)
        const handleFocus = () => {
            dispatch(fetchConversations());
            setForceUpdate(prev => prev + 1);
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            socket.disconnect();
        };
    }, [dispatch]);



    const handleChatClick = () => {
        if (onChatClick) {
            onChatClick();
        }
        // Сбрасываем счетчик при переходе в чат
        setForceUpdate(0);
    };

    return (
        <>
            <AppBar
                position="static"
                sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: 'none'
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    {/* Логотип/Название */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HomeIcon sx={{ color: '#fff', fontSize: isMobile ? 24 : 28 }} />
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                color: '#fff',
                                fontSize: isMobile ? 18 : 24
                            }}
                        >
                            Мастер-классы 🎨
                        </Typography>
                    </Box>

                    {/* Кнопки чата и профиля */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Кнопка чата */}
                        <Badge badgeContent={unreadCount} color="error" sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.75rem',
                                height: '20px',
                                minWidth: '20px',
                                borderRadius: '10px',
                                background: '#ff4444',
                                color: '#fff'
                            }
                        }}>
                            <IconButton
                                onClick={handleChatClick}
                                sx={{
                                    color: '#fff',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        transform: 'scale(1.05)',
                                        borderColor: 'rgba(255, 255, 255, 0.5)'
                                    },
                                    '&:active': {
                                        transform: 'scale(0.95)'
                                    }
                                }}
                            >
                                <ChatIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
                            </IconButton>
                        </Badge>

                        {/* Кнопка профиля */}
                        <IconButton
                            onClick={() => { }}
                            sx={{
                                color: '#fff',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    transform: 'scale(1.05)',
                                    borderColor: 'rgba(255, 255, 255, 0.5)'
                                },
                                '&:active': {
                                    transform: 'scale(0.95)'
                                }
                            }}
                        >
                            <PersonIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Диалог профиля */}
            {/* <ChildProfile
                open={profileOpen}
                currentUser={currentUser}
                onClose={handleProfileClose}
                onLogout={handleLogout}
                onUpdateProfile={handleUpdateProfile}
            /> */}
        </>
    );
};

export default ChildMenu; 