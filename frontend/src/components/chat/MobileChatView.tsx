/**
 * @file: MobileChatView.tsx
 * @description: Мобильная версия чата с улучшенной адаптивностью
 * @dependencies: React, Material-UI, Redux
 * @created: 2025-01-12
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Drawer,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    ArrowBack,
    Menu
} from '@mui/icons-material';
import type { RootState } from '../../store';
import type { Chat } from '../../types';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NotificationBadge from './NotificationBadge';

interface MobileChatViewProps {
    conversations: Chat[];
    currentChat: Chat | null;
    onBackToChats: () => void;
}

const MobileChatView: React.FC<MobileChatViewProps> = ({
    conversations,
    currentChat,
    onBackToChats
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    if (!isMobile) {
        return null; // Показываем только на мобильных устройствах
    }

    const isChild = user?.role === 'child';

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: isChild ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            overflow: 'hidden', // Предотвращаем выход за границы экрана
            position: 'relative' // Относительное позиционирование
        }}>
            {/* Мобильная шапка - для всех пользователей */}
            <AppBar
                position="static"
                sx={{
                    background: isChild ? 'rgba(255, 255, 255, 0.1)' : 'primary.main',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    flexShrink: 0 // Предотвращаем сжатие шапки
                }}
            >
                <Toolbar>
                    {currentChat ? (
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={onBackToChats}
                            sx={{ mr: 2 }}
                        >
                            <ArrowBack />
                        </IconButton>
                    ) : (
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ mr: 2 }}
                        >
                            <Menu />
                        </IconButton>
                    )}

                    <Typography variant="h6" sx={{
                        flexGrow: 1,
                        color: isChild ? '#fff' : 'inherit'
                    }}>
                        {currentChat ? 'Чат' : 'Сообщения'}
                    </Typography>

                    {!currentChat && (
                        <NotificationBadge />
                    )}
                </Toolbar>
            </AppBar>

            {/* Основной контент */}
            <Box sx={{
                flex: 1,
                overflow: 'hidden',
                background: isChild ? 'transparent' : 'transparent',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {currentChat ? (
                    <ChatWindow
                        chat={currentChat}
                        socket={null}
                    />
                ) : (
                    <Box sx={{
                        height: '100%',
                        background: isChild ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        overflow: 'hidden'
                    }}>
                        <ChatList
                            conversations={conversations}
                            currentChat={currentChat}
                        />
                    </Box>
                )}
            </Box>

            {/* Боковое меню для мобильных устройств */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: '80%',
                        maxWidth: 300,
                        background: isChild ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'background.paper'
                    }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: isChild ? '#fff' : 'inherit',
                            fontFamily: isChild ? '"Fredoka One", Arial, sans-serif' : 'inherit'
                        }}
                    >
                        💬 Чаты
                    </Typography>
                </Box>

                <ChatList
                    conversations={conversations}
                    currentChat={currentChat}
                />
            </Drawer>
        </Box>
    );
};

export default MobileChatView; 