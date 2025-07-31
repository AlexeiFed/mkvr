/**
 * @file: ChatList.tsx
 * @description: Компонент списка чатов с возможностью создания нового чата и фильтрации
 * @dependencies: React, Material-UI, Redux
 * @created: 2025-01-12
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Box,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Badge
} from '@mui/material';
import {
    Person,
    AdminPanelSettings,
    Add,
    Message,
    Search,
    Send,
    Clear
} from '@mui/icons-material';
import type { Chat } from '../../types';
import type { RootState } from '../../store';
import type { AppDispatch } from '../../store';
import { setCurrentChat, fetchMessages, startChildChat, resetUnreadCount } from '../../store/chatSlice';
import SendAllModal from './SendAllModal';

interface ChatListProps {
    conversations: Chat[];
    currentChat: Chat | null;
}

const ChatList: React.FC<ChatListProps> = ({ conversations, currentChat }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { messages } = useSelector((state: RootState) => state.chat);
    const { user } = useSelector((state: RootState) => state.auth);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSendAll, setShowSendAll] = useState(false);

    const handleChatSelect = async (chat: Chat) => {
        const existingMessages = messages[chat.id] || [];
        dispatch(setCurrentChat(chat));
        if (existingMessages.length === 0) {
            console.log('Загружаем сообщения для чата:', chat.id);
            await dispatch(fetchMessages(chat.id));
        } else {
            console.log('Сообщения уже загружены для чата:', chat.id);
        }
        await dispatch(resetUnreadCount(chat.id));
    };

    const handleStartNewChat = async () => {
        try {
            const result = await dispatch(startChildChat());
            if (startChildChat.fulfilled.match(result)) {
                const newChat = result.payload;
                dispatch(setCurrentChat(newChat));
                await dispatch(fetchMessages(newChat.id));
            }
        } catch (error) {
            console.error('Ошибка создания чата:', error);
        }
    };



    const getLastMessage = (chat: Chat) => {
        const chatMessages = messages[chat.id] || [];
        return chatMessages[chatMessages.length - 1];
    };

    const getChatName = (chat: Chat) => {
        if (user?.role === 'admin') {
            return `${chat.parent.firstName} ${chat.parent.lastName}`;
        } else {
            return `${chat.admin.firstName} ${chat.admin.lastName}`;
        }
    };

    const getChatAvatar = () => {
        if (user?.role === 'admin') {
            return <Person />;
        } else {
            return <AdminPanelSettings />;
        }
    };

    // Подсчитываем непрочитанные сообщения для конкретного чата
    const getUnreadCount = (chat: Chat) => {
        const chatMessages = messages[chat.id] || [];
        return chatMessages.filter(msg =>
            !msg.isRead && msg.senderId !== user?.id
        ).length;
    };


    // Фильтрация чатов по поисковому запросу
    const filteredConversations = conversations.filter(chat => {
        const chatName = getChatName(chat).toLowerCase();
        return chatName.includes(searchTerm.toLowerCase());
    });

    const isChild = user?.role === 'child';
    const isAdmin = user?.role === 'admin';

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Заголовок с количеством непрочитанных */}
            <Box sx={{
                p: 2,
                borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                background: isChild ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(10px)'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit',
                            color: isChild ? '#fff' : 'inherit'
                        }}
                    >
                        💬 Чаты
                    </Typography>

                </Box>

                {/* Поиск */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Поиск чатов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: isChild ? 'rgba(255, 255, 255, 0.7)' : 'inherit' }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => setSearchTerm('')}
                                    sx={{ color: isChild ? 'rgba(255, 255, 255, 0.7)' : 'inherit' }}
                                >
                                    <Clear />
                                </IconButton>
                            </InputAdornment>
                        ),
                        sx: {
                            color: isChild ? '#fff' : 'inherit',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: isChild ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: isChild ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.87)'
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: isChild ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
                                opacity: 1
                            }
                        }
                    }}
                />

                {/* Кнопка создания нового чата для ребенка */}
                {isChild && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleStartNewChat}
                        sx={{
                            mt: 1,
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            fontFamily: '"Fredoka One", Arial, sans-serif',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.3)',
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            }
                        }}
                    >
                        Написать администратору
                    </Button>
                )}

                {/* Кнопка "Отправить всем" для админа */}
                {isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={() => setShowSendAll(true)}
                        sx={{
                            mt: 1,
                            width: '100%',
                            background: '#1976d2',
                            color: '#fff',
                            '&:hover': {
                                background: '#1565c0'
                            }
                        }}
                    >
                        Отправить всем
                    </Button>
                )}
            </Box>

            {/* Список чатов */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {filteredConversations.length === 0 ? (
                    <Box p={3} textAlign="center">
                        <Message sx={{
                            fontSize: 48,
                            color: isChild ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
                            mb: 2
                        }} />
                        <Typography
                            variant="body1"
                            sx={{
                                color: isChild ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                                fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit'
                            }}
                        >
                            {searchTerm
                                ? 'Чаты не найдены'
                                : user?.role === 'admin'
                                    ? 'Нет активных чатов'
                                    : 'Нажмите кнопку выше, чтобы начать чат с администратором!'
                            }
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ width: '100%' }}>
                        {filteredConversations.map((chat) => {
                            const lastMessage = getLastMessage(chat);
                            const isSelected = currentChat?.id === chat.id;
                            const unreadCount = getUnreadCount(chat);

                            return (
                                <ListItem
                                    key={chat.id}
                                    onClick={() => handleChatSelect(chat)}
                                    sx={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected
                                            ? (isChild ? 'rgba(255, 255, 255, 0.2)' : '#e3f2fd')
                                            : 'transparent',
                                        borderLeft: isSelected
                                            ? (isChild ? '4px solid #fff' : '4px solid #1976d2')
                                            : '4px solid transparent',
                                        '&:hover': {
                                            backgroundColor: isChild
                                                ? 'rgba(255, 255, 255, 0.1)'
                                                : 'rgba(25, 118, 210, 0.08)'
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Badge badgeContent={unreadCount} color="error">
                                            <Avatar sx={{
                                                background: isChild ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                                                color: isChild ? '#fff' : 'inherit'
                                            }}>
                                                {getChatAvatar()}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography
                                                    variant="subtitle2"
                                                    noWrap
                                                    sx={{
                                                        color: isChild ? '#fff' : 'inherit',
                                                        fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit'
                                                    }}
                                                >
                                                    {getChatName(chat)}
                                                </Typography>

                                            </Box>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                color={isChild ? "rgba(255, 255, 255, 0.7)" : "text.secondary"}
                                                noWrap
                                                sx={{
                                                    fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit'
                                                }}
                                            >
                                                {lastMessage
                                                    ? lastMessage.content.length > 30
                                                        ? `${lastMessage.content.substring(0, 30)}...`
                                                        : lastMessage.content
                                                    : 'Нет сообщений'
                                                }
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </Box>

            {/* Модальное окно для отправки всем */}
            <SendAllModal
                open={showSendAll}
                onClose={() => setShowSendAll(false)}
            />
        </Box>
    );
};

export default ChatList; 