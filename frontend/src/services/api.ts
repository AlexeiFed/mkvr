/**
 * @file: api.ts
 * @description: API сервис для работы с backend
 * @dependencies: axios
 * @created: 2025-01-29
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Отладочная информация
console.log('API_BASE_URL:', API_BASE_URL);
console.log('NODE_ENV:', import.meta.env.MODE);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Все переменные окружения:', import.meta.env);

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Отправляем запрос к:', config.url);
    return config;
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
    (response) => {
        console.log('Получен ответ от:', response.config.url);
        return response;
    },
    (error) => {
        console.error('Ошибка API:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api; 