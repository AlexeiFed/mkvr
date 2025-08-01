/**
 * @file: UsersList.tsx
 * @description: Компонент списка пользователей с фильтрами и пагинацией
 * @dependencies: react, mui, types
 * @created: 2025-07-25
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Pagination,
    Typography,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import { Visibility, Delete } from '@mui/icons-material';
import type { User } from '../../types';

interface UsersListProps {
    users: User[];
    total: number;
    filters: {
        school?: string;
        grade?: string;
        city?: string;
        role?: string;
        page: number;
        pageSize: number;
    };
    isLoading: boolean;
    onFilterChange: (filters: Partial<UsersListProps['filters']>) => void;
    onPageChange: (page: number) => void;
    onUserSelect: (userId: number) => void;
    onUserDelete: (userId: number) => void;
}

const UsersList: React.FC<UsersListProps> = ({
    users,
    total,
    filters,
    isLoading,
    onFilterChange,
    onPageChange,
    onUserSelect,
    onUserDelete
}) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [cities, setCities] = useState<string[]>([]);
    const [schools, setSchools] = useState<Array<{ id: number, name: string, address: string }>>([]);
    const [classes, setClasses] = useState<Array<{ id: number, name: string, school: { id: number, name: string } }>>([]);

    useEffect(() => {
        // Загрузка городов из API
        fetch('http://localhost:3001/api/schools/cities')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.cities) {
                    setCities(data.cities);
                }
            })
            .catch(err => console.error('Ошибка загрузки городов:', err));

        // Загрузка школ из API
        fetch('http://localhost:3001/api/schools/list')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.schools) {
                    setSchools(data.schools);
                }
            })
            .catch(err => console.error('Ошибка загрузки школ:', err));

        // Загрузка классов из API
        fetch('http://localhost:3001/api/schools/classes')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.classes) {
                    setClasses(data.classes);
                }
            })
            .catch(err => console.error('Ошибка загрузки классов:', err));
    }, []);

    const handleFilterChange = (field: keyof typeof filters, value: string | number | undefined) => {
        onFilterChange({ [field]: value });
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            onUserDelete(userToDelete.id);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'error';
            case 'parent': return 'primary';
            case 'child': return 'success';
            case 'executor': return 'warning';
            default: return 'default';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Администратор';
            case 'parent': return 'Родитель';
            case 'child': return 'Ребенок';
            case 'executor': return 'Исполнитель';
            default: return role;
        }
    };

    const totalPages = Math.ceil(total / filters.pageSize);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Фильтры */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Город</InputLabel>
                    <Select
                        value={filters.city || ''}
                        onChange={(e) => {
                            handleFilterChange('city', e.target.value || undefined);
                            handleFilterChange('school', undefined);
                            handleFilterChange('grade', undefined);
                        }}
                        label="Город"
                    >
                        <MenuItem value="">Все города</MenuItem>
                        {cities.map(city => (
                            <MenuItem key={city} value={city}>{city}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Школа</InputLabel>
                    <Select
                        value={filters.school || ''}
                        onChange={(e) => {
                            handleFilterChange('school', e.target.value || undefined);
                            handleFilterChange('grade', undefined);
                        }}
                        label="Школа"
                        disabled={!filters.city}
                    >
                        <MenuItem value="">Все школы</MenuItem>
                        {schools
                            .filter(school => !filters.city || school.address?.split(',')[0]?.trim() === filters.city)
                            .map(school => (
                                <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>
                            ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Класс</InputLabel>
                    <Select
                        value={filters.grade || ''}
                        onChange={(e) => handleFilterChange('grade', e.target.value || undefined)}
                        label="Класс"
                        disabled={!filters.school}
                    >
                        <MenuItem value="">Все классы</MenuItem>
                        {classes
                            .filter(cls => !filters.school || cls.school?.id === parseInt(filters.school))
                            .map(cls => (
                                <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                            ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Роль</InputLabel>
                    <Select
                        value={filters.role || ''}
                        onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                        label="Роль"
                    >
                        <MenuItem value="">Все роли</MenuItem>
                        <MenuItem value="admin">Администратор</MenuItem>
                        <MenuItem value="parent">Родитель</MenuItem>
                        <MenuItem value="child">Ребенок</MenuItem>
                        <MenuItem value="executor">Исполнитель</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Таблица */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Имя</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Роль</TableCell>
                            <TableCell>Школа</TableCell>
                            <TableCell>Класс</TableCell>
                            <TableCell>Дата регистрации</TableCell>
                            <TableCell>Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={getRoleLabel(user.role)}
                                        color={getRoleColor(user.role) as 'error' | 'primary' | 'success' | 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {user.school ? user.school : '-'}
                                </TableCell>
                                <TableCell>
                                    {user.grade ? user.grade : '-'}
                                </TableCell>
                                <TableCell>
                                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => onUserSelect(user.id)}
                                        size="small"
                                        color="primary"
                                    >
                                        <Visibility />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDeleteClick(user)}
                                        size="small"
                                        color="error"
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Пагинация */}
            {totalPages > 1 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={totalPages}
                        page={filters.page}
                        onChange={(_, page) => onPageChange(page)}
                        color="primary"
                    />
                </Box>
            )}

            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                Всего пользователей: {total}
            </Typography>

            {/* Диалог подтверждения удаления */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography id="delete-dialog-description">
                        Вы уверены, что хотите удалить пользователя "{userToDelete?.firstName} {userToDelete?.lastName}"?
                        Это действие необратимо.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Отмена
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UsersList; 