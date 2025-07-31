/**
 * @file: ChatContainer.tsx
 * @description: Основной контейнер для чата с WebSocket и push-уведомлениями
 * @dependencies: React, Redux, Material-UI, socket.io-client
 * @created: 2025-01-12
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, CircularProgress, Alert, useTheme, useMediaQuery } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import type { RootState } from '../../store';
import type { AppDispatch } from '../../store';
import type { Message } from '../../types';
import { fetchConversations, addMessage, setCurrentChat } from '../../store/chatSlice';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import PushNotificationSetup from './PushNotificationSetup';
import MobileChatView from './MobileChatView';

const ChatContainer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { conversations, currentChat, isLoading, error } = useSelector((state: RootState) => state.chat);
    const { user } = useSelector((state: RootState) => state.auth);
    const [socket, setSocket] = useState<Socket | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Дополнительная проверка для мобильных устройств
    const isMobileDevice = isMobile || window.innerWidth <= 768;

    useEffect(() => {
        // Загружаем чаты при монтировании
        dispatch(fetchConversations());

        // Подключаемся к WebSocket
        const newSocket = io('http://localhost:3001', {
            transports: ['websocket'],
            withCredentials: true
        });
        setSocket(newSocket);

        // Слушаем только новые сообщения, не обновляем список чатов
        newSocket.on('chat:message', (data: { chatId: number; message: Message }) => {
            console.log('Получено новое сообщение через WebSocket:', data);
            dispatch(addMessage(data.message));
        });

        return () => {
            newSocket.disconnect();
        };
    }, [dispatch]);

    // Убираем обработчики фокуса и видимости, которые вызывают перезагрузку

    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
                sx={{
                    background: user?.role === 'child'
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'transparent',
                    borderRadius: user?.role === 'child' ? 2 : 0,
                    margin: user?.role === 'child' ? 2 : 0
                }}
            >
                <CircularProgress sx={{ color: user?.role === 'child' ? '#fff' : 'primary' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // Определяем стили в зависимости от роли пользователя
    const isChild = user?.role === 'child';

    // Показываем мобильную версию на мобильных устройствах
    if (isMobileDevice) {
        return (
            <MobileChatView
                conversations={conversations}
                currentChat={currentChat}
                onBackToChats={() => dispatch(setCurrentChat(null))}
            />
        );
    }

    return (
        <Box sx={{
            height: isMobile ? '100vh' : (isChild ? 'calc(100vh - 120px)' : 'calc(100vh - 100px)'),
            display: 'flex',
            flexDirection: 'column',
            background: isChild ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            borderRadius: isChild && !isMobile ? 2 : 0,
            margin: isChild && !isMobile ? 2 : 0,
            overflow: 'hidden',
            maxHeight: isMobile ? '100vh' : 'none', // Ограничиваем высоту на мобильных
            position: 'relative' // Относительное позиционирование
        }}>
            {/* Заголовок - только для десктопа */}
            {!isMobile && (
                <Box sx={{
                    p: 2,
                    borderBottom: isChild ? '2px solid rgba(255, 255, 255, 0.2)' : 1,
                    borderColor: isChild ? 'transparent' : 'divider',
                    background: isChild ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    backdropFilter: isChild ? 'blur(10px)' : 'none'
                }}>
                    <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                            fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit',
                            color: isChild ? '#fff' : 'inherit',
                            textAlign: isChild ? 'center' : 'left'
                        }}
                    >
                        {isChild ? '💬 Чат с администратором' : '💬 Чат с пользователями'}
                    </Typography>
                    <PushNotificationSetup />
                </Box>
            )}

            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Список чатов - только для десктопа */}
                {!isMobile && (
                    <Box sx={{
                        width: 300,
                        borderRight: isChild ? '2px solid rgba(255, 255, 255, 0.2)' : 1,
                        borderColor: isChild ? 'transparent' : 'divider',
                        background: isChild ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        backdropFilter: isChild ? 'blur(10px)' : 'none'
                    }}>
                        <ChatList conversations={conversations} currentChat={currentChat} />
                    </Box>
                )}

                {/* Область чата */}
                <Box sx={{
                    flex: 1,
                    background: isChild ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    transition: 'all 0.3s ease-in-out'
                }}>
                    {currentChat ? (
                        <ChatWindow chat={currentChat} socket={socket} />
                    ) : (
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="100%"
                            flexDirection="column"
                            sx={{ p: isChild ? 3 : 2 }}
                        >
                            <Typography
                                variant="h6"
                                color={isChild ? "#fff" : "text.secondary"}
                                gutterBottom
                                sx={{
                                    fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit',
                                    textAlign: 'center'
                                }}
                            >
                                {isChild
                                    ? '👋 Привет! Я здесь, чтобы помочь тебе!'
                                    : 'Выберите чат для начала общения'
                                }
                            </Typography>
                            <Typography
                                variant="body1"
                                color={isChild ? "rgba(255, 255, 255, 0.8)" : "text.secondary"}
                                sx={{
                                    fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit',
                                    textAlign: 'center',
                                    maxWidth: 400
                                }}
                            >
                                {user?.role === 'admin'
                                    ? 'Выберите пользователя из списка для начала чата'
                                    : 'Ожидайте сообщения от администратора. Мы скоро свяжемся с вами! 😊'
                                }
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default ChatContainer; 