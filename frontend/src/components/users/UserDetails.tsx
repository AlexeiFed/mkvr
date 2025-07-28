/**
 * @file: UserDetails.tsx
 * @description: Компонент для отображения детальной информации о пользователе
 * @dependencies: react, redux, mui, types
 * @created: 2025-07-25
 */

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';

import { Close, Delete } from '@mui/icons-material';
import type { AppDispatch } from '../../store';
import { deleteUser } from '../../store/usersSlice';
import type { User } from '../../store/usersSlice';

interface UserDetailsProps {
    userId: number;
    onClose: () => void;
}

const UserDetails: React.FC<UserDetailsProps> = ({ userId, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch(`http://localhost:3001/api/users/${userId}`);
                if (!response.ok) {
                    throw new Error('Ошибка загрузки данных пользователя');
                }
                const data = await response.json();
                setUser(data.user);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, [userId]);

    const handleDelete = async () => {
        if (!user) return;

        if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${user.firstName} ${user.lastName}?`)) {
            return;
        }

        try {
            setIsDeleting(true);
            await dispatch(deleteUser(userId)).unwrap();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка удаления пользователя');
        } finally {
            setIsDeleting(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'error';
            case 'parent': return 'primary';
            case 'child': return 'success';
            default: return 'default';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Администратор';
            case 'parent': return 'Родитель';
            case 'child': return 'Ребенок';
            default: return role;
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {isLoading ? 'Загрузка...' : `Пользователь: ${user?.firstName} ${user?.lastName}`}
                    </Typography>
                    <Button onClick={onClose} startIcon={<Close />}>
                        Закрыть
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : user ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Основная информация
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    ID пользователя
                                </Typography>
                                <Typography variant="body1">{user.id}</Typography>
                            </Box>

                            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Роль
                                </Typography>
                                <Chip
                                    label={getRoleLabel(user.role)}
                                    color={getRoleColor(user.role) as 'error' | 'primary' | 'success' | 'default'}
                                    size="small"
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Имя
                                </Typography>
                                <Typography variant="body1">{user.firstName}</Typography>
                            </Box>

                            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Фамилия
                                </Typography>
                                <Typography variant="body1">{user.lastName}</Typography>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="textSecondary">
                                Email
                            </Typography>
                            <Typography variant="body1">{user.email}</Typography>
                        </Box>

                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Учебная информация
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Школа
                                </Typography>
                                <Typography variant="body1">
                                    {user.school?.name || 'Не указана'}
                                </Typography>
                            </Box>

                            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Класс
                                </Typography>
                                <Typography variant="body1">
                                    {user.class?.name || 'Не указан'}
                                </Typography>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Системная информация
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Дата регистрации
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                </Typography>
                            </Box>

                            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Последнее обновление
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(user.updatedAt).toLocaleDateString('ru-RU')}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Typography>Пользователь не найден</Typography>
                )}
            </DialogContent>

            {user && (
                <DialogActions>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        startIcon={<Delete />}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Удаление...' : 'Удалить пользователя'}
                    </Button>
                    <Button onClick={onClose}>
                        Закрыть
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default UserDetails; 