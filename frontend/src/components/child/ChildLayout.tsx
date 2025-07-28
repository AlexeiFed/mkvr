/**
 * @file: ChildLayout.tsx
 * @description: Layout для детского интерфейса с градиентом и игровым стилем
 * @dependencies: React, Fredoka One (Google Fonts), Redux, WebSocket
 * @created: 2024-07-12
 */

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchConversations } from '../../store/chatSlice';
import { io } from 'socket.io-client';
import type { AppDispatch } from '../../store';

const gradientStyle: React.CSSProperties = {
    minHeight: '100vh',
    minWidth: '320px',
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: '"Fredoka One", Arial, sans-serif',
    background: 'linear-gradient(135deg, #ff5ecd 0%, #ffb347 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 0,
};

const ChildLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch<AppDispatch>();

    // Глобальное обновление чатов для актуального счетчика уведомлений
    useEffect(() => {
        // Загружаем чаты при монтировании
        dispatch(fetchConversations());

        // Подключаемся к WebSocket для получения обновлений в реальном времени
        const socket = io('http://localhost:3001', {
            transports: ['websocket'],
            withCredentials: true
        });

        socket.on('chat:message', () => {
            console.log('ChildLayout: получено новое сообщение, обновляем чаты');
            dispatch(fetchConversations());
        });

        socket.on('chat:updated', () => {
            console.log('ChildLayout: чат обновлен, обновляем чаты');
            dispatch(fetchConversations());
        });

        return () => {
            socket.disconnect();
        };
    }, [dispatch]);

    return (
        <div style={gradientStyle}>
            {/* Хедер/меню будет добавлен позже */}
            {children}
        </div>
    );
};

export default ChildLayout; 