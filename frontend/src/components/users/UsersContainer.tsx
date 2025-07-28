/**
 * @file: UsersContainer.tsx
 * @description: Контейнер для страницы управления пользователями (админ)
 * @dependencies: react, redux, mui, UsersList, UserDetails
 * @created: 2025-07-25
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, Alert } from '@mui/material';
import type { AppDispatch, RootState } from '../../store';
import { fetchUsers, setFilters, clearError, deleteUser } from '../../store/usersSlice';
import UsersList from './UsersList';
import UserDetails from './UserDetails';

const UsersContainer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { users, total, isLoading, error, filters } = useSelector((state: RootState) => state.users);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    useEffect(() => {
        dispatch(fetchUsers(filters));
    }, [dispatch, filters]);

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        dispatch(setFilters({ ...newFilters, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        dispatch(setFilters({ page }));
    };

    const handleUserSelect = (userId: number) => {
        setSelectedUserId(userId);
    };

    const handleCloseDetails = () => {
        setSelectedUserId(null);
    };

    const handleUserDelete = (userId: number) => {
        dispatch(deleteUser(userId));
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" onClose={() => dispatch(clearError())}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Управление пользователями
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <UsersList
                    users={users}
                    total={total}
                    filters={filters}
                    isLoading={isLoading}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    onUserSelect={handleUserSelect}
                    onUserDelete={handleUserDelete}
                />
            </Paper>

            {selectedUserId && (
                <UserDetails
                    userId={selectedUserId}
                    onClose={handleCloseDetails}
                />
            )}
        </Box>
    );
};

export default UsersContainer; 