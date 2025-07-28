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
router.post('/subscribe', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { endpoint, p256dh, auth } = req.body;
        const userId = (req as any).user.id;

        if (!endpoint || !p256dh || !auth) {
            return res.status(400).json({
                success: false,
                error: 'Необходимы все параметры подписки'
            });
        }

        // Удаляем старую подписку если есть
        await (prisma as any).pushSubscription.deleteMany({
            where: { userId }
        });

        // Создаем новую подписку
        await (prisma as any).pushSubscription.create({
            data: {
                userId,
                endpoint,
                p256dh,
                auth
            }
        });

        return res.json({ success: true, message: 'Подписка успешно создана' });
    } catch (error) {
        console.error('Ошибка создания подписки:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка создания подписки'
        });
    }
});

// POST /api/chat/unsubscribe - Отписаться от push-уведомлений
router.post('/unsubscribe', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        await (prisma as any).pushSubscription.deleteMany({
            where: { userId }
        });

        return res.json({ success: true, message: 'Подписка удалена' });
    } catch (error) {
        console.error('Ошибка удаления подписки:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка удаления подписки'
        });
    }
});

// GET /api/chat/conversations - Получить список чатов пользователя
router.get('/conversations', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        let chats;
        if (userRole === 'admin') {
            // Админ видит все чаты
            chats = await prisma.chat.findMany({
                include: {
                    parent: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    admin: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
        } else {
            // Родитель видит только свои чаты
            chats = await prisma.chat.findMany({
                where: { parentId: userId },
                include: {
                    parent: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    admin: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
        }

        return res.json({ success: true, chats });
    } catch (error) {
        console.error('Ошибка получения чатов:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка получения чатов'
        });
    }
});

// GET /api/chat/:chatId/messages - Получить сообщения чата
router.get('/:chatId/messages', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: 'ID чата обязателен'
            });
        }

        // Проверяем доступ к чату
        const chat = await prisma.chat.findUnique({
            where: { id: parseInt(chatId) },
            include: {
                parent: true,
                admin: true
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Чат не найден'
            });
        }

        if (userRole !== 'admin' && chat.parentId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Нет доступа к этому чату'
            });
        }

        const messages = await prisma.message.findMany({
            where: { chatId: parseInt(chatId) },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            },
            orderBy: { timestamp: 'asc' }
        });

        // Отмечаем сообщения как прочитанные
        await prisma.message.updateMany({
            where: {
                chatId: parseInt(chatId),
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

        return res.json({ success: true, messages });
    } catch (error) {
        console.error('Ошибка получения сообщений:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка получения сообщений'
        });
    }
});

// POST /api/chat/:chatId/mark-read - Отметить сообщения как прочитанные
router.post('/:chatId/mark-read', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const userId = (req as any).user.id;

        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: 'ID чата обязателен'
            });
        }

        // Проверяем доступ к чату
        const chat = await prisma.chat.findUnique({
            where: { id: parseInt(chatId) },
            include: {
                parent: true,
                admin: true
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Чат не найден'
            });
        }

        // Отмечаем все сообщения от других пользователей как прочитанные
        await prisma.message.updateMany({
            where: {
                chatId: parseInt(chatId),
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('Ошибка сброса счетчика:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка сброса счетчика'
        });
    }
});

// POST /api/chat/:chatId/messages - Отправить сообщение
router.post('/:chatId/messages', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: 'ID чата обязателен'
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Сообщение не может быть пустым'
            });
        }

        // Проверяем доступ к чату
        const chat = await prisma.chat.findUnique({
            where: { id: parseInt(chatId) },
            include: {
                parent: true,
                admin: true
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Чат не найден'
            });
        }

        if (userRole !== 'admin' && chat.parentId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Нет доступа к этому чату'
            });
        }

        // Создаем сообщение
        const message = await prisma.message.create({
            data: {
                chatId: parseInt(chatId),
                senderId: userId,
                content: content.trim()
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });

        // Обновляем время последнего сообщения в чате
        await prisma.chat.update({
            where: { id: parseInt(chatId) },
            data: { updatedAt: new Date() }
        });

        // Отправляем сообщение через WebSocket
        io.emit('chat:message', {
            chatId: parseInt(chatId),
            message
        });

        // Отправляем уведомление об обновлении чата
        io.emit('chat:updated', {
            chatId: parseInt(chatId)
        });

        // Отправляем push-уведомление получателю
        const recipientId = userRole === 'admin' ? chat.parentId : chat.adminId;
        await sendPushNotification(recipientId, {
            title: `Новое сообщение от ${message.sender.firstName} ${message.sender.lastName}`,
            body: content.length > 50 ? content.substring(0, 50) + '...' : content,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
                chatId: parseInt(chatId),
                messageId: message.id
            }
        });

        return res.json({ success: true, message });
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка отправки сообщения'
        });
    }
});

// POST /api/chat/start - Начать новый чат
router.post('/start', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { parentId } = req.body;
        const adminId = (req as any).user.id;
        const userRole = (req as any).user.role;

        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Только администраторы могут создавать чаты'
            });
        }

        if (!parentId) {
            return res.status(400).json({
                success: false,
                error: 'ID родителя обязателен'
            });
        }

        // Проверяем существование родителя
        const parent = await prisma.user.findUnique({
            where: { id: parseInt(parentId) }
        });

        if (!parent || parent.role !== 'parent') {
            return res.status(404).json({
                success: false,
                error: 'Родитель не найден'
            });
        }

        // Проверяем, есть ли уже чат с этим родителем
        const existingChat = await prisma.chat.findFirst({
            where: {
                parentId: parseInt(parentId),
                adminId
            }
        });

        if (existingChat) {
            return res.json({ success: true, chat: existingChat });
        }

        // Создаем новый чат
        const chat = await prisma.chat.create({
            data: {
                parentId: parseInt(parentId),
                adminId
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        return res.json({ success: true, chat });
    } catch (error) {
        console.error('Ошибка создания чата:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка создания чата'
        });
    }
});

// POST /api/chat/start-child - Начать новый чат ребенком с администратором
router.post('/start-child', authenticateToken, async (req: Request, res: Response) => {
    try {
        const childId = (req as any).user.id;
        const userRole = (req as any).user.role;

        if (userRole !== 'child') {
            return res.status(403).json({
                success: false,
                error: 'Только дети могут создавать чаты с администраторами'
            });
        }

        // Находим первого доступного администратора
        const admin = await prisma.user.findFirst({
            where: { role: 'admin' }
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'Администратор не найден'
            });
        }

        // Проверяем, есть ли уже чат с этим ребенком
        const existingChat = await prisma.chat.findFirst({
            where: {
                parentId: childId,
                adminId: admin.id
            }
        });

        if (existingChat) {
            return res.json({ success: true, chat: existingChat });
        }

        // Создаем новый чат
        const chat = await prisma.chat.create({
            data: {
                parentId: childId,
                adminId: admin.id
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        return res.json({ success: true, chat });
    } catch (error) {
        console.error('Ошибка создания чата ребенком:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка создания чата'
        });
    }
});

// POST /api/chat/send-to-all - Отправить сообщение всем пользователям
router.post('/send-to-all', authenticateToken, async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user.id;
        const userRole = (req as any).user.role;

        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Только администраторы могут отправлять сообщения всем'
            });
        }

        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Необходимо указать текст сообщения'
            });
        }

        // Получаем всех активных пользователей (детей и родителей)
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ['child', 'parent']
                }
            }
        });

        const sentMessages = [];

        for (const user of users) {
            // Находим или создаем чат с каждым пользователем
            let chat = await prisma.chat.findFirst({
                where: {
                    parentId: user.id,
                    adminId
                }
            });

            if (!chat) {
                chat = await prisma.chat.create({
                    data: {
                        parentId: user.id,
                        adminId
                    }
                });
            }

            // Создаем сообщение
            const messageData: any = {
                chatId: chat.id,
                senderId: adminId,
                content: content,
                isRead: false
            };

            const message = await prisma.message.create({
                data: messageData,
                include: {
                    sender: {
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

        return res.json({
            success: true,
            message: `Сообщение отправлено ${users.length} пользователям`,
            sentCount: users.length
        });

    } catch (error) {
        console.error('Ошибка отправки сообщения всем:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка отправки сообщения всем'
        });
    }
});

// Функция для отправки push-уведомлений
async function sendPushNotification(userId: number, payload: any) {
    try {
        const subscriptions = await (prisma as any).pushSubscription.findMany({
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
                    await (prisma as any).pushSubscription.delete({
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