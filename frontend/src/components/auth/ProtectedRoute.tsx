/**
 * @file: ProtectedRoute.tsx
 * @description: Компонент для защиты роутов, требующих аутентификации
 * @dependencies: react, react-redux, @mui/material
 * @created: 2024-07-06
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import { fetchCurrentUser } from '../../store/authSlice';
import type { RootState, AppDispatch } from '../../store';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'ADMIN' | 'EXECUTOR' | 'PARENT' | 'CHILD';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, user, token, isLoading } = useSelector(
        (state: RootState) => state.auth
    );
    const [tried, setTried] = useState(false);

    console.log('[ProtectedRoute] render', { token, user, isLoading, tried });

    useEffect(() => {
        if (token && !user && !isLoading && !tried) {
            console.log('[ProtectedRoute] dispatch fetchCurrentUser');
            dispatch(fetchCurrentUser()).finally(() => setTried(true));
        }
    }, [dispatch, token, user, isLoading, tried]);

    // Показываем загрузку при проверке аутентификации
    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                flexDirection="column"
            >
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Проверка аутентификации...
                </Typography>
            </Box>
        );
    }

    // Если не аутентифицирован, перенаправляем на страницу входа
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Проверяем роль, если она указана
    if (requiredRole && user.role !== requiredRole) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                flexDirection="column"
            >
                <Typography variant="h4" gutterBottom>
                    Недостаточно прав
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Для доступа к этой странице требуется роль: {requiredRole}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Ваша роль: {user.role}
                </Typography>
            </Box>
        );
    }

    // Если все проверки пройдены, показываем защищенный контент
    return <>{children}</>;
};

export default ProtectedRoute; 