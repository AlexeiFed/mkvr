/**
 * @file: pushNotifications.ts
 * @description: Сервис для работы с push-уведомлениями на фронтенде
 * @dependencies: api service
 * @created: 2025-01-29
 */

import { api } from './api';

export interface PushSubscription {
    endpoint: string;
    p256dh: string;
    auth: string;
}

export class PushNotificationService {
    private static swRegistration: ServiceWorkerRegistration | null = null;
    private static vapidPublicKey: string | null = null;

    /**
     * Инициализация push-уведомлений
     */
    static async initialize(): Promise<boolean> {
        try {
            // Проверяем поддержку Service Worker
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.log('Push-уведомления не поддерживаются в этом браузере');
                return false;
            }

            // Регистрируем Service Worker
            this.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker зарегистрирован:', this.swRegistration);

            // Получаем VAPID публичный ключ
            const response = await api.get('/push-notifications/vapid-public-key');
            this.vapidPublicKey = response.data.publicKey;

            return true;
        } catch (error) {
            console.error('Ошибка инициализации push-уведомлений:', error);
            return false;
        }
    }

    /**
     * Запросить разрешение на push-уведомления
     */
    static async requestPermission(): Promise<boolean> {
        try {
            if (!this.swRegistration) {
                console.error('Service Worker не зарегистрирован');
                return false;
            }

            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Ошибка запроса разрешения:', error);
            return false;
        }
    }

    /**
     * Подписаться на push-уведомления
     */
    static async subscribe(): Promise<boolean> {
        try {
            if (!this.swRegistration || !this.vapidPublicKey) {
                console.error('Service Worker или VAPID ключ не инициализированы');
                return false;
            }

            // Проверяем разрешение
            const permission = await this.requestPermission();
            if (!permission) {
                console.log('Разрешение на уведомления не получено');
                return false;
            }

            // Получаем существующую подписку
            let subscription = await this.swRegistration.pushManager.getSubscription();

            if (!subscription) {
                // Создаем новую подписку
                subscription = await this.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
                });
            }

            // Отправляем подписку на сервер
            await api.post('/push-notifications/subscribe', {
                endpoint: subscription.endpoint,
                p256dh: btoa(String.fromCharCode.apply(null,
                    Array.from(new Uint8Array(subscription.getKey('p256dh')!))
                )),
                auth: btoa(String.fromCharCode.apply(null,
                    Array.from(new Uint8Array(subscription.getKey('auth')!))
                ))
            });

            console.log('Подписка на push-уведомления создана');
            return true;
        } catch (error) {
            console.error('Ошибка подписки на push-уведомления:', error);
            return false;
        }
    }

    /**
     * Отписаться от push-уведомлений
     */
    static async unsubscribe(): Promise<boolean> {
        try {
            if (!this.swRegistration) {
                return false;
            }

            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                await api.delete('/push-notifications/unsubscribe', {
                    data: { endpoint: subscription.endpoint }
                });
                console.log('Отписка от push-уведомлений выполнена');
            }

            return true;
        } catch (error) {
            console.error('Ошибка отписки от push-уведомлений:', error);
            return false;
        }
    }

    /**
     * Проверить статус подписки
     */
    static async getSubscriptionStatus(): Promise<boolean> {
        try {
            if (!this.swRegistration) {
                return false;
            }

            const subscription = await this.swRegistration.pushManager.getSubscription();
            return !!subscription;
        } catch (error) {
            console.error('Ошибка проверки статуса подписки:', error);
            return false;
        }
    }

    /**
     * Конвертировать VAPID ключ в Uint8Array
     */
    private static urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
} 