/**
 * @file: Dashboard.tsx
 * @description: Основная панель управления с навигацией
 * @dependencies: react, react-redux, @mui/material
 * @created: 2024-07-06
 */

import React from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Chip,
    Divider,
} from '@mui/material';
import type { RootState } from '../store';

const Dashboard: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);

    const getRoleLabel = (role: string) => {
        const roleLabels = {
            admin: 'Администратор',
            executor: 'Исполнитель',
            parent: 'Родитель',
            child: 'Ребенок',
        };
        return roleLabels[role as keyof typeof roleLabels] || role;
    };

    const getRoleColor = (role: string) => {
        const roleColors = {
            admin: 'error',
            executor: 'warning',
            parent: 'info',
            child: 'success',
        };
        return roleColors[role as keyof typeof roleColors] || 'default';
    };

    const renderContent = () => {
        return (
            <Box sx={{ p: 3 }}>
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        maxWidth: 800,
                        margin: '0 auto',
                        borderRadius: 2,
                    }}
                >
                    {/* Информация о пользователе */}
                    <Box display="flex" alignItems="center" mb={3}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                fontSize: '2rem',
                                backgroundColor: 'primary.main',
                                mr: 3,
                            }}
                        >
                            {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" gutterBottom>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                {user?.email}
                            </Typography>
                            <Chip
                                label={getRoleLabel(user?.role || '')}
                                color={getRoleColor(user?.role || '') as 'error' | 'warning' | 'info' | 'success' | 'default'}
                                size="small"
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Дополнительная информация */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Дополнительная информация
                        </Typography>
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    ID пользователя
                                </Typography>
                                <Typography variant="body1">{user?.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Дата регистрации
                                </Typography>
                                <Typography variant="body1">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : ''}
                                </Typography>
                            </Box>
                            {user?.phone && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Телефон
                                    </Typography>
                                    <Typography variant="body1">{user.phone}</Typography>
                                </Box>
                            )}
                            {user?.city && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Город
                                    </Typography>
                                    <Typography variant="body1">{user.city}</Typography>
                                </Box>
                            )}
                            {user?.school && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Школа
                                    </Typography>
                                    <Typography variant="body1">{user.school}</Typography>
                                </Box>
                            )}
                            {user?.grade && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Класс
                                    </Typography>
                                    <Typography variant="body1">{user.grade}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Статистика */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Статистика
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Статистика будет доступна после реализации основных модулей
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        );
    };

    if (!user) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Typography variant="h6">Загрузка данных пользователя...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5' }}>
            {renderContent()}
        </Box>
    );
};

export default Dashboard; 