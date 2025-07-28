/**
 * @file: AuthContainer.tsx
 * @description: Контейнер для переключения между формами аутентификации
 * @dependencies: react, LoginForm, RegisterForm
 * @created: 2024-07-06
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import type { RootState } from '../../store';

const AuthContainer: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    // Перенаправление уже аутентифицированных пользователей
    useEffect(() => {
        if (isAuthenticated && user) {
            // Перенаправляем на главную страницу, которая сама определит куда направить по роли
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleSwitchToRegister = () => {
        setIsLogin(false);
    };

    const handleSwitchToLogin = () => {
        setIsLogin(true);
    };

    return (
        <>
            {isLogin ? (
                <LoginForm onSwitchToRegister={handleSwitchToRegister} />
            ) : (
                <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
            )}
        </>
    );
};

export default AuthContainer; 