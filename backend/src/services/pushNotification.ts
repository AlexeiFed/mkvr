/**
 * @file: pushNotification.ts
 * @description: Сервис для работы с push-уведомлениями
 * @dependencies: web-push, prisma
 * @created: 2025-01-29
 */

import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Генерируем VAPID ключи (в продакшене должны быть сохранены в env)
const vapidKeys = webpush.generateVAPIDKeys();

export const VAPID_PUBLIC_KEY = vapidKeys.publicKey;
export const VAPID_PRIVATE_KEY = vapidKeys.privateKey;

webpush.setVapidDetails(
    'mailto:admin@mkvr.ru',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
}

export class PushNotificationService {
    /**
     * Отправить уведомление конкретному пользователю
     */
    static async sendToUser(userId: number, payload: PushNotificationPayload): Promise<void> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { pushSubscriptions: true }
            });

            if (!user || user.pushSubscriptions.length === 0) {
                console.log(`Пользователь ${userId} не имеет подписок на push-уведомления`);
                return;
            }

            const notificationPayload = JSON.stringify({
                title: payload.title,
                body: payload.body,
                icon: payload.icon || '/icon-192x192.png',
                badge: payload.badge || '/badge-72x72.png',
                data: payload.data || {}
            });

            for (const subscription of user.pushSubscriptions) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: subscription.p256dh,
                                auth: subscription.auth
                            }
                        },
                        notificationPayload
                    );
                    console.log(`Уведомление отправлено пользователю ${userId} на endpoint: ${subscription.endpoint}`);
                } catch (error: any) {
                    console.error(`Ошибка отправки уведомления пользователю ${userId}:`, error);

                    // Если подписка недействительна, удаляем её
                    if (error.statusCode === 410) {
                        await prisma.pushSubscription.delete({
                            where: { id: subscription.id }
                        });
                        console.log(`Удалена недействительная подписка для пользователя ${userId}`);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка в PushNotificationService.sendToUser:', error);
        }
    }

    /**
     * Отправить уведомление о назначении на мастер-класс
     */
    static async sendWorkshopAssignmentNotification(
        executorId: number,
        workshopId: number,
        workshopTitle: string,
        workshopDate: Date
    ): Promise<void> {
        const payload: PushNotificationPayload = {
            title: 'Новое назначение на мастер-класс',
            body: `Вас назначили на мастер-класс "${workshopTitle}" ${workshopDate.toLocaleDateString('ru-RU')}`,
            data: {
                type: 'workshop_assignment',
                workshopId: workshopId,
                url: `/executor/workshops/${workshopId}`
            }
        };

        await this.sendToUser(executorId, payload);
    }

    /**
     * Отправить уведомление о изменении статуса мастер-класса
     */
    static async sendWorkshopStatusChangeNotification(
        executorId: number,
        workshopId: number,
        workshopTitle: string,
        newStatus: string
    ): Promise<void> {
        const statusText = {
            'scheduled': 'запланирован',
            'in-progress': 'начался',
            'completed': 'завершен',
            'cancelled': 'отменен'
        }[newStatus] || newStatus;

        const payload: PushNotificationPayload = {
            title: 'Изменение статуса мастер-класса',
            body: `Мастер-класс "${workshopTitle}" ${statusText}`,
            data: {
                type: 'workshop_status_change',
                workshopId: workshopId,
                status: newStatus,
                url: `/executor/workshops/${workshopId}`
            }
        };

        await this.sendToUser(executorId, payload);
    }
} 