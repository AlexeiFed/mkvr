/**
 * @file: index.ts
 * @description: Основной файл сервера Express
 * @dependencies: express, cors, helmet, morgan, dotenv
 * @created: 2024-07-06
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

const server = http.createServer(app);

// Инициализация socket.io
const io = new SocketIOServer(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Экспортируем io для использования в роутерах
export { io };

// Обработка WebSocket подключений
io.on('connection', (socket) => {
    console.log('Клиент подключился:', socket.id);

    // Присоединяемся к комнате чата
    socket.on('join-chat', (chatId: number) => {
        socket.join(`chat-${chatId}`);
        console.log(`Клиент ${socket.id} присоединился к чату ${chatId}`);
    });

    // Покидаем комнату чата
    socket.on('leave-chat', (chatId: number) => {
        socket.leave(`chat-${chatId}`);
        console.log(`Клиент ${socket.id} покинул чат ${chatId}`);
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключился:', socket.id);
    });
});

const prisma = new PrismaClient();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Безопасность с разрешением cross-origin
// Настройка CORS для фронта
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined')); // Логирование
app.use(express.json()); // Парсинг JSON
app.use(express.urlencoded({ extended: true })); // Парсинг URL-encoded

// Обработка OPTIONS запросов для статики
app.options('/uploads/*', (_req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5174');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.sendStatus(200);
});

// Раздача статики с CORS-заголовками
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
console.log('STATIC UPLOADS PATH:', uploadsPath);
app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.set('Access-Control-Allow-Credentials', 'true');
        res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Базовый роут
app.get('/', (_req, res) => {
    res.json({
        message: 'MKVR API - Сервер работает',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
    });
});

// Тестовый endpoint для проверки подключения к базе данных
app.get('/api/test-db', async (_req, res) => {
    try {
        const users = await prisma.user.findMany({ take: 5 });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Подключаем API роуты
app.use('/api', apiRoutes);

// Обработка ошибок
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
    });
});

// 404 handler
app.use('*', (_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Маршрут не найден',
    });
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 API доступен по адресу: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

export default app; 