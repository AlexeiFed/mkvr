// @ts-nocheck
/**
 * @file: pushNotifications.ts
 * @description: API для работы с push-уведомлениями
 * @dependencies: express, prisma, pushNotification service
 * @created: 2025-01-29
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { VAPID_PUBLIC_KEY } from '../services/pushNotification';

const router = express.Router();
const prisma = new PrismaClient();

// Получить VAPID публичный ключ
router.get('/vapid-public-key', (_req, res) => {
    return res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Подписаться на push-уведомления
router.post('/subscribe', authenticateToken, async (req, res) => {
    try {
        const { endpoint, p256dh, auth } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        if (!endpoint || !p256dh || !auth) {
            return res.status(400).json({ error: 'Необходимы все параметры подписки' });
        }

        // Проверяем, существует ли уже такая подписка
        const existingSubscription = await prisma.pushSubscription.findFirst({
            where: {
                userId: userId,
                endpoint: endpoint
            }
        });

        if (existingSubscription) {
            // Обновляем существующую подписку
            await prisma.pushSubscription.update({
                where: { id: existingSubscription.id },
                data: {
                    p256dh: p256dh,
                    auth: auth,
                    updatedAt: new Date()
                }
            });
        } else {
            // Создаем новую подписку
            await prisma.pushSubscription.create({
                data: {
                    userId: userId,
                    endpoint: endpoint,
                    p256dh: p256dh,
                    auth: auth
                }
            });
        }

        return res.json({ message: 'Подписка на push-уведомления успешно создана' });
    } catch (error) {
        console.error('Ошибка при создании подписки на push-уведомления:', error);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Отписаться от push-уведомлений
router.delete('/unsubscribe', authenticateToken, async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        if (!endpoint) {
            return res.status(400).json({ error: 'Необходим endpoint для отписки' });
        }

        await prisma.pushSubscription.deleteMany({
            where: {
                userId: userId,
                endpoint: endpoint
            }
        });

        return res.json({ message: 'Отписка от push-уведомлений успешно выполнена' });
    } catch (error) {
        console.error('Ошибка при отписке от push-уведомлений:', error);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить подписки пользователя
router.get('/subscriptions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: userId },
            select: {
                id: true,
                endpoint: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return res.json({ subscriptions });
    } catch (error) {
        console.error('Ошибка при получении подписок:', error);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

export default router; 