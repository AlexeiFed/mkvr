/**
 * @file: PushNotificationSetup.tsx
 * @description: Компонент для настройки push-уведомлений
 * @dependencies: React, Material-UI, Redux
 * @created: 2025-01-12
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Alert,
    Switch,
    FormControlLabel,
    Chip
} from '@mui/material';
import { Notifications, NotificationsOff } from '@mui/icons-material';
import type { RootState } from '../../store';
import type { AppDispatch } from '../../store';
import { subscribeToPush, unsubscribeFromPush, setPushSubscription } from '../../store/chatSlice';
import type { PushSubscription } from '../../types';

const PushNotificationSetup: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isPushEnabled } = useSelector((state: RootState) => state.chat);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Проверяем поддержку push-уведомлений
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestNotificationPermission = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                await subscribeToNotifications();
            }
        } catch (error) {
            setError('Ошибка запроса разрешения на уведомления');
        }
    };

    const subscribeToNotifications = async () => {
        try {
            // Регистрируем service worker
            const registration = await navigator.serviceWorker.register('/sw.js');

            // Получаем VAPID публичный ключ
            const response = await fetch('/api/chat/vapid-public-key');
            const { publicKey } = await response.json();

            // Подписываемся на push-уведомления
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicKey
            });

            // Отправляем подписку на сервер
            const pushSubscription: PushSubscription = {
                endpoint: subscription.endpoint,
                p256dh: btoa(String.fromCharCode.apply(null,
                    Array.from(new Uint8Array(subscription.getKey('p256dh')!))
                )),
                auth: btoa(String.fromCharCode.apply(null,
                    Array.from(new Uint8Array(subscription.getKey('auth')!))
                ))
            };

            await dispatch(subscribeToPush(pushSubscription));
            dispatch(setPushSubscription(pushSubscription));
            setError(null);
        } catch (error) {
            setError('Ошибка подписки на уведомления');
        }
    };

    const unsubscribeFromNotifications = async () => {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
            }

            await dispatch(unsubscribeFromPush());
            setError(null);
        } catch (error) {
            setError('Ошибка отписки от уведомлений');
        }
    };

    const handleToggle = async () => {
        if (isPushEnabled) {
            await unsubscribeFromNotifications();
        } else {
            if (permission === 'granted') {
                await subscribeToNotifications();
            } else {
                await requestNotificationPermission();
            }
        }
    };

    if (!isSupported) {
        return (
            <Box sx={{ mt: 1 }}>
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    Push-уведомления не поддерживаются в вашем браузере
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isPushEnabled}
                            onChange={handleToggle}
                            disabled={permission === 'denied'}
                        />
                    }
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isPushEnabled ? <Notifications color="primary" /> : <NotificationsOff />}
                            <Typography variant="body2">
                                Push-уведомления
                            </Typography>
                        </Box>
                    }
                />

                {permission === 'granted' && (
                    <Chip label="Разрешено" size="small" color="success" />
                )}
                {permission === 'denied' && (
                    <Chip label="Заблокировано" size="small" color="error" />
                )}
                {permission === 'default' && (
                    <Chip label="Не запрошено" size="small" color="warning" />
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ fontSize: '0.875rem', mt: 1 }}>
                    {error}
                </Alert>
            )}

            {permission === 'denied' && (
                <Alert severity="warning" sx={{ fontSize: '0.875rem', mt: 1 }}>
                    Уведомления заблокированы. Разрешите их в настройках браузера.
                </Alert>
            )}

            {permission === 'default' && !isPushEnabled && (
                <Alert severity="info" sx={{ fontSize: '0.875rem', mt: 1 }}>
                    Включите уведомления, чтобы получать сообщения в реальном времени
                </Alert>
            )}
        </Box>
    );
};

export default PushNotificationSetup; 