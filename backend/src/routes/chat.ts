/**
 * @file: chat.ts
 * @description: Роутер для работы с чатом и push-уведомлениями
 * @dependencies: express, @prisma/client, web-push, socket.io
 * @created: 2025-01-12
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import { io } from '../index';
import { authenticateToken } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

const router = Router();
const prisma = new PrismaClient();

// Генерируем VAPID ключи (в продакшене должны быть в .env)
const vapidKeys = webpush.generateVAPIDKeys();

// Настройка web-push
webpush.setVapidDetails(
    'mailto:admin@mkvr.ru',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);



// GET /api/chat/vapid-public-key - Получить публичный VAPID ключ
router.get('/vapid-public-key', (_req: Request, res: Response) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

// POST /api/chat/subscribe - Подписаться на push-уведомления
router.post('/subscribe', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { endpoint, p256dh, auth } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
            return;
        }

        if (!endpoint || !p256dh || !auth) {
            res.status(400).json({
                success: false,
                error: 'Необходимы все параметры подписки'
            });
            return;
        }

        // Удаляем старую подписку если есть
        await prisma.pushSubscription.deleteMany({
            where: { userId }
        });

        // Создаем новую подписку
        await prisma.pushSubscription.create({
            data: {
                userId,
                endpoint,
                p256dh,
                auth
            }
        });

        res.json({ success: true, message: 'Подписка успешно создана' });
    } catch (error) {
        console.error('Ошибка создания подписки:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка создания подписки'
        });
    }
});

// POST /api/chat/unsubscribe - Отписаться от push-уведомлений
router.post('/unsubscribe', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
            return;
        }

        await prisma.pushSubscription.deleteMany({
            where: { userId }
        });

        res.json({ success: true, message: 'Подписка удалена' });
    } catch (error) {
        console.error('Ошибка удаления подписки:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка удаления подписки'
        });
    }
});

// GET /api/chat/conversations - Получить список чатов пользователя
router.get('/conversations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
            return;
        }

        let chats;
        if (userRole === 'ADMIN') {
            // Админ видит все чаты
            chats = await prisma.chat.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
        } else {
            // Пользователь видит только свои чаты
            chats = await prisma.chat.findMany({
                where: { userId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
        }

        res.json({ success: true, chats });
    } catch (error) {
        console.error('Ошибка получения чатов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения чатов'
        });
    }
});

// GET /api/chat/:chatId/messages - Получить сообщения чата
router.get('/:chatId/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const chatId = parseInt(req.params.chatId);
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
            return;
        }

        // Проверяем существование чата и права доступа
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        if (!chat) {
            res.status(404).json({
                success: false,
                error: 'Чат не найден'
            });
            return;
        }

        // Проверяем права доступа (только участник чата или админ)
        if (chat.userId !== userId && req.user?.role !== 'ADMIN') {
            res.status(403).json({
                success: false,
                error: 'Нет прав доступа к чату'
            });
            return;
        }

        const messages = await prisma.message.findMany({
            where: { chatId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Ошибка получения сообщений:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения сообщений'
        });
    }
});

// POST /api/chat/:chatId/mark-read - Отметить сообщения как прочитанные
router.post('/:chatId/mark-read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const chatId = parseInt(req.params.chatId);
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
            return;
        }

        // Проверяем существование чата и права доступа
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        if (!chat) {
            res.status(404).json({
                success: false,
                error: 'Чат не найден'
            });
            return;
        }

        // Проверяем права доступа (только участник чата или админ)
        if (chat.userId !== userId && req.user?.role !== 'ADMIN') {
            res.status(403).json({
                success: false,
                error: 'Нет прав доступа к чату'
            });
            return;
        }

        // В текущей схеме нет поля isRead, поэтому просто возвращаем успех
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка сброса счетчика:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сброса счетчика'
        });
    }
});

// POST /api/chat/:chatId/messages - Отправить сообщение
router.post('/:chatId/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const chatId = parseInt(req.params.chatId);
        const { content } = req.body;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
            return;
        }

        if (!content || content.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: 'Сообщение не может быть пустым'
            });
            return;
        }

        // Проверяем существование чата и права доступа
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        if (!chat) {
            res.status(404).json({
                success: false,
                error: 'Чат не найден'
            });
            return;
        }

        // Проверяем права доступа (только участник чата или админ)
        if (chat.userId !== userId && userRole !== 'ADMIN') {
            res.status(403).json({
                success: false,
                error: 'Нет прав доступа к чату'
            });
            return;
        }

        // Создаем сообщение
        const message = await prisma.message.create({
            data: {
                chatId,
                userId,
                content: content.trim()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Обновляем время последнего сообщения в чате
        await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });

        // Отправляем сообщение через WebSocket
        if (io) {
            io.emit('chat:message', {
                chatId,
                message
            });

            // Отправляем уведомление об обновлении чата
            io.emit('chat:updated', {
                chatId
            });
        }

        // Отправляем push-уведомление получателю (если это не админ)
        if (userRole !== 'ADMIN') {
            await sendPushNotification(chat.userId, {
                title: `Новое сообщение от ${message.user.firstName} ${message.user.lastName}`,
                body: content.length > 50 ? content.substring(0, 50) + '...' : content,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                data: {
                    chatId,
                    messageId: message.id
                }
            });
        }

        res.json({ success: true, message });
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка отправки сообщения'
        });
    }
});

// POST /api/chat/start - Начать новый чат
router.post('/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId: targetUserId } = req.body;
        const adminId = req.user?.id;
        const userRole = req.user?.role;

        if (!adminId || userRole !== 'ADMIN') {
            res.status(403).json({
                success: false,
                error: 'Только администраторы могут создавать чаты'
            });
            return;
        }

        if (!targetUserId) {
            res.status(400).json({
                success: false,
                error: 'ID пользователя обязателен'
            });
            return;
        }

        // Проверяем существование пользователя
        const targetUser = await prisma.user.findUnique({
            where: { id: parseInt(targetUserId) }
        });

        if (!targetUser) {
            res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
            return;
        }

        // Проверяем, есть ли уже чат с этим пользователем
        const existingChat = await prisma.chat.findFirst({
            where: {
                userId: parseInt(targetUserId)
            }
        });

        if (existingChat) {
            res.json({ success: true, chat: existingChat });
            return;
        }

        // Создаем новый чат
        const chat = await prisma.chat.create({
            data: {
                userId: parseInt(targetUserId)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        res.json({ success: true, chat });
    } catch (error) {
        console.error('Ошибка создания чата:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка создания чата'
        });
    }
});

// POST /api/chat/start-child - Начать новый чат ребенком с администратором
router.post('/start-child', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const childId = req.user?.id;
        const userRole = req.user?.role;

        if (!childId || userRole !== 'CHILD') {
            res.status(403).json({
                success: false,
                error: 'Только дети могут создавать чаты с администраторами'
            });
            return;
        }

        // Находим первого доступного администратора
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            res.status(404).json({
                success: false,
                error: 'Администратор не найден'
            });
            return;
        }

        // Проверяем, есть ли уже чат с этим ребенком
        const existingChat = await prisma.chat.findFirst({
            where: {
                userId: childId
            }
        });

        if (existingChat) {
            res.json({ success: true, chat: existingChat });
            return;
        }

        // Создаем новый чат
        const chat = await prisma.chat.create({
            data: {
                userId: childId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        res.json({ success: true, chat });
    } catch (error) {
        console.error('Ошибка создания чата ребенком:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка создания чата'
        });
    }
});

// POST /api/chat/send-to-all - Отправить сообщение всем пользователям
router.post('/send-to-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const adminId = req.user?.id;
        const userRole = req.user?.role;

        if (!adminId || userRole !== 'ADMIN') {
            res.status(403).json({
                success: false,
                error: 'Только администраторы могут отправлять сообщения всем'
            });
            return;
        }

        const { content } = req.body;

        if (!content) {
            res.status(400).json({
                success: false,
                error: 'Необходимо указать текст сообщения'
            });
            return;
        }

        // Получаем всех активных пользователей (детей и родителей)
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ['CHILD', 'PARENT']
                }
            }
        });

        const sentMessages = [];

        for (const user of users) {
            // Находим или создаем чат с каждым пользователем
            let chat = await prisma.chat.findFirst({
                where: {
                    userId: user.id
                }
            });

            if (!chat) {
                chat = await prisma.chat.create({
                    data: {
                        userId: user.id
                    }
                });
            }

            // Создаем сообщение
            const message = await prisma.message.create({
                data: {
                    chatId: chat.id,
                    userId: adminId,
                    content: content
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });

            sentMessages.push(message);

            // Отправляем push-уведомление
            await sendPushNotification(user.id, {
                title: 'Новое сообщение от администратора',
                body: content,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                data: {
                    chatId: chat.id,
                    messageId: message.id
                }
            });
        }

        // Отправляем через WebSocket всем подключенным клиентам
        if (io) {
            io.emit('chat:broadcast', {
                message: sentMessages[0], // Отправляем первое сообщение как образец
                totalRecipients: users.length
            });
        }

        res.json({
            success: true,
            message: `Сообщение отправлено ${users.length} пользователям`,
            sentCount: users.length
        });

    } catch (error) {
        console.error('Ошибка отправки сообщения всем:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка отправки сообщения всем'
        });
    }
});

// Функция для отправки push-уведомлений
async function sendPushNotification(userId: number, payload: any) {
    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth
                        }
                    },
                    JSON.stringify(payload)
                );
            } catch (error: any) {
                console.error('Ошибка отправки push-уведомления:', error);
                // Удаляем недействительную подписку
                if (error.statusCode === 410) {
                    await prisma.pushSubscription.delete({
                        where: { id: subscription.id }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Ошибка получения подписок:', error);
    }
}

export default router; 