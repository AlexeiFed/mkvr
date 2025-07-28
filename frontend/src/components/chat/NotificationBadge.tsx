/**
 * @file: NotificationBadge.tsx
 * @description: Компонент для отображения уведомлений о новых сообщениях
 * @dependencies: React, Material-UI, Redux
 * @created: 2025-01-12
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import type { RootState } from '../../store';

interface NotificationBadgeProps {
    onClick?: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onClick }) => {
    const { conversations, messages } = useSelector((state: RootState) => state.chat);
    const { user } = useSelector((state: RootState) => state.auth);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Подсчитываем непрочитанные сообщения
        let totalUnread = 0;

        conversations.forEach(chat => {
            const chatMessages = messages[chat.id] || [];
            const unreadInChat = chatMessages.filter(msg =>
                !msg.isRead && msg.senderId !== user?.id
            ).length;
            totalUnread += unreadInChat;
        });

        setUnreadCount(totalUnread);
    }, [conversations, messages, user?.id]);

    return (
        <Tooltip title={unreadCount > 0 ? `${unreadCount} новых сообщений` : 'Нет новых сообщений'}>
            <IconButton
                onClick={onClick}
                sx={{
                    color: 'inherit',
                    position: 'relative'
                }}
            >
                <Badge
                    badgeContent={unreadCount}
                    color="error"
                    max={99}
                    sx={{
                        '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            height: '20px',
                            minWidth: '20px',
                            borderRadius: '10px'
                        }
                    }}
                >
                    <Notifications />
                </Badge>
            </IconButton>
        </Tooltip>
    );
};

export default NotificationBadge; 