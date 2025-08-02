/**
 * @file: ChatWindow.tsx
 * @description: Компонент окна чата для отображения и отправки сообщений
 * @dependencies: React, Material-UI, Redux, socket.io-client
 * @created: 2025-01-12
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    useMediaQuery,
    useTheme,
    CircularProgress
} from '@mui/material';
import { Send, Person, AdminPanelSettings } from '@mui/icons-material';
import { Socket } from 'socket.io-client';
import type { Chat } from '../../types';
import type { RootState } from '../../store';
import type { AppDispatch } from '../../store';
import { sendMessage } from '../../store/chatSlice';
import { saveScrollPosition } from '../../store/chatSlice';

interface ChatWindowProps {
    chat: Chat;
    socket: Socket | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { messages } = useSelector((state: RootState) => state.chat);
    const user = useSelector((state: RootState) => state.auth.user);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const scrollPositions = useSelector((state: RootState) => state.chat.scrollPositions);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
            const isChild = user?.role === 'CHILD';

    const chatMessages = messages[chat.id] || [];

    // Сохраняем позицию скролла при изменении чата
    useEffect(() => {
        if (chat && messagesContainerRef.current) {
            const savedPosition = scrollPositions[chat.id];
            if (savedPosition !== undefined) {
                console.log('ChatWindow: восстанавливаем позицию скролла для чата', chat.id, 'позиция:', savedPosition);
                messagesContainerRef.current.scrollTop = savedPosition;
            }
        }
    }, [chat?.id, scrollPositions]);

    // Сохраняем позицию при изменении чата
    useEffect(() => {
        return () => {
            // Сохраняем позицию при размонтировании компонента (смене чата)
            if (chat && messagesContainerRef.current) {
                const position = messagesContainerRef.current.scrollTop;
                dispatch(saveScrollPosition({ chatId: chat.id, position }));
                console.log('ChatWindow: сохраняем позицию скролла для чата', chat.id, 'позиция:', position);
            }
        };
    }, [chat?.id, dispatch]);

    // Сохраняем позицию скролла при скролле
    const handleScroll = () => {
        if (chat && messagesContainerRef.current) {
            const position = messagesContainerRef.current.scrollTop;
            dispatch(saveScrollPosition({ chatId: chat.id, position }));
        }
    };

    // Автоматическая прокрутка к последнему сообщению только для новых сообщений
    useEffect(() => {
        if (chatMessages.length > 0 && messagesEndRef.current) {
            const lastMessage = chatMessages[chatMessages.length - 1];
            const isNewMessage = Date.now() - new Date(lastMessage.timestamp).getTime() < 5000; // Новое сообщение (5 секунд)

            if (isNewMessage) {
                console.log('ChatWindow: прокрутка к новому сообщению');
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [chatMessages.length]);

    // Логируем изменения сообщений для отладки
    useEffect(() => {
        console.log('ChatWindow: обновление сообщений для чата', chat.id, 'количество:', chatMessages.length);
    }, [chat.id, chatMessages.length]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        try {
            // Отправляем только через Redux, WebSocket будет обработан автоматически
            await dispatch(sendMessage({ chatId: chat.id, content: messageContent }));
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            // Возвращаем сообщение в поле ввода при ошибке
            setNewMessage(messageContent);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const getChatName = () => {
        if (user?.role === 'ADMIN') {
            return `${chat.parent.firstName} ${chat.parent.lastName}`;
        } else {
            return `${chat.admin.firstName} ${chat.admin.lastName}`;
        }
    };

    const getChatAvatar = () => {
        if (user?.role === 'ADMIN') {
            return <Person />;
        } else {
            return <AdminPanelSettings />;
        }
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: isChild ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
        }}>
            {/* Заголовок чата - только для админа на десктопе */}
            {!isChild && !isMobile && (
                <Box sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'transparent'
                }}>
                    <Avatar sx={{
                        mr: 2,
                        background: 'rgba(0, 0, 0, 0.1)',
                        color: 'inherit'
                    }}>
                        {getChatAvatar()}
                    </Avatar>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'inherit'
                            }}
                        >
                            {getChatName()}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {chatMessages.length > 0 ? 'Активный чат' : 'Новый чат'}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Область сообщений */}
            <Box
                ref={messagesContainerRef}
                onScroll={handleScroll}
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: isMobile ? 1 : 2,
                    background: isChild ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    pb: isMobile ? 8 : 2, // Добавляем отступ снизу на мобильных для поля ввода
                    height: '100%', // Занимаем всю доступную высоту
                    maxHeight: '100%' // Ограничиваем максимальную высоту
                }}>
                {chatMessages.length === 0 ? (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                        flexDirection="column"
                    >
                        <Typography
                            variant="h6"
                            color={isChild ? "#fff" : "text.secondary"}
                            sx={{
                                fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit',
                                textAlign: 'center'
                            }}
                        >
                            👋 Начните общение!
                        </Typography>
                        <Typography
                            variant="body2"
                            color={isChild ? "rgba(255, 255, 255, 0.7)" : "text.secondary"}
                            sx={{
                                fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit',
                                textAlign: 'center',
                                mt: 1
                            }}
                        >
                            Напишите первое сообщение
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {chatMessages.map((message) => {
                            const isOwnMessage = message.senderId === user?.id;

                            return (
                                <Box
                                    key={message.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                        mb: 1
                                    }}
                                >
                                    <Paper
                                        sx={{
                                            p: isMobile ? 1 : 2,
                                            maxWidth: isMobile ? '85%' : '70%',
                                            backgroundColor: isOwnMessage
                                                ? (isChild ? 'rgba(255, 255, 255, 0.2)' : '#1976d2')
                                                : (isChild ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5'),
                                            color: isOwnMessage
                                                ? (isChild ? '#fff' : '#fff')
                                                : (isChild ? '#fff' : '#000'),
                                            borderRadius: 2,
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit',
                                                fontSize: isMobile ? '0.875rem' : '1rem'
                                            }}
                                        >
                                            {message.content}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                mt: 0.5,
                                                opacity: 0.7,
                                                fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit'
                                            }}
                                        >
                                            {formatTime(message.timestamp)}
                                        </Typography>
                                    </Paper>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Box>
                )}
            </Box>

            {/* Поле ввода сообщений */}
            <Box sx={{
                p: isMobile ? 1 : 2,
                borderTop: isMobile ? '1px solid rgba(0, 0, 0, 0.1)' : (isChild ? '2px solid rgba(255, 255, 255, 0.2)' : 1),
                borderColor: isChild ? 'transparent' : 'divider',
                background: isChild ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                position: isMobile ? 'sticky' : 'static', // Фиксируем внизу на мобильных
                bottom: isMobile ? 0 : 'auto',
                left: isMobile ? 0 : 'auto',
                right: isMobile ? 0 : 'auto',
                zIndex: isMobile ? 1000 : 'auto',
                width: isMobile ? '100%' : 'auto',
                backdropFilter: isMobile ? 'blur(10px)' : 'none',
                flexShrink: 0 // Предотвращаем сжатие поля ввода
            }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Введите сообщение..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSending}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: isChild ? '#000' : 'inherit', // Черный текст для ребенка
                                backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.95)' : 'transparent', // Более непрозрачный фон
                                '& fieldset': {
                                    borderColor: isChild ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)'
                                },
                                '&:hover fieldset': {
                                    borderColor: isChild ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.87)'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: isChild ? 'rgba(255, 255, 255, 0.8)' : '#1976d2'
                                }
                            },
                            '& .MuiInputBase-input': {
                                color: isChild ? '#000' : 'inherit', // Черный текст для ввода
                                '&::placeholder': {
                                    color: isChild ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.5)', // Серый плейсхолдер для админа
                                    opacity: 1
                                }
                            }
                        }}
                    />
                    <IconButton
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        sx={{
                            backgroundColor: isChild ? 'rgba(255, 255, 255, 0.2)' : '#1976d2',
                            color: isChild ? '#fff' : '#fff',
                            minWidth: 48,
                            height: 48,
                            '&:hover': {
                                backgroundColor: isChild ? 'rgba(255, 255, 255, 0.3)' : '#1565c0'
                            },
                            '&:disabled': {
                                backgroundColor: isChild ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)',
                                color: isChild ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)'
                            }
                        }}
                    >
                        {isSending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};

export default ChatWindow; 