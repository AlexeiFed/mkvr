/**
 * @file: subServices.ts
 * @description: Роутер для CRUD операций с комплектацией (SubService)
 * @dependencies: express, @prisma/client
 * @created: 2024-07-07
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../types/express';

const router = Router();
const prisma = new PrismaClient();

// Получить все комплектации
router.get('/', async (_req: Request, res: Response) => {
    try {
        const subServices = await prisma.subService.findMany({
            include: {
                service: true,
                variants: {
                    orderBy: { id: 'asc' }
                }
            },
            orderBy: { id: 'asc' }
        });

        // Нормализуем все subServices
        subServices.forEach((subService: any) => {
            if (Array.isArray(subService.photos)) {
                subService.photos = subService.photos.map((photo: string) => photo.trim()).filter(Boolean);
            }
        });

        res.json({ success: true, subServices });
    } catch (error) {
        console.error('Ошибка получения комплектаций:', error);
        res.status(500).json({ success: false, error: 'Ошибка при получении комплектаций' });
    }
});

// Получить комплектации по услуге
router.get('/service/:serviceId', async (req: Request, res: Response) => {
    try {
        const serviceId = Number(req.params['serviceId']);
        if (isNaN(serviceId)) {
            res.status(400).json({ success: false, error: 'Некорректный ID услуги' });
            return;
        }

        const subServices = await prisma.subService.findMany({
            where: { serviceId },
            include: {
                service: true,
                variants: {
                    orderBy: { id: 'asc' }
                }
            },
            orderBy: { id: 'asc' }
        });

        // Нормализуем все subServices
        subServices.forEach((subService: any) => {
            if (Array.isArray(subService.photos)) {
                subService.photos = subService.photos.map((photo: string) => photo.trim()).filter(Boolean);
            }
        });

        res.json({ success: true, subServices });
    } catch (error) {
        console.error('Ошибка получения комплектаций услуги:', error);
        res.status(500).json({ success: false, error: 'Ошибка при получении комплектаций услуги' });
    }
});

// Получить комплектацию по id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }

        const subService = await prisma.subService.findUnique({
            where: { id },
            include: {
                service: true,
                variants: {
                    orderBy: { id: 'asc' }
                }
            }
        });

        if (!subService) {
            res.status(404).json({ success: false, error: 'Комплектация не найдена' });
            return;
        }

        // Нормализуем photos
        if (Array.isArray((subService as any).photos)) {
            (subService as any).photos = (subService as any).photos.map((photo: string) => photo.trim()).filter(Boolean);
        }

        res.json({ success: true, subService });
    } catch (error) {
        console.error('Ошибка получения комплектации:', error);
        res.status(500).json({ success: false, error: 'Ошибка при получении комплектации' });
    }
});

// Создать комплектацию
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, description, avatar, photos, video, serviceId, minAge, price, variants } = req.body;

        const subServiceData = {
            name,
            description,
            avatar,
            photos: photos || [],
            video,
            serviceId,
            minAge: minAge || 0,
            price: price || 0,
            isActive: true
        };

        const subService = await prisma.subService.create({
            data: subServiceData,
            include: {
                variants: true
            }
        });

        // Если есть варианты, создаем их
        if (variants && variants.length > 0) {
            for (const variant of variants) {
                await prisma.subServiceVariant.create({
                    data: {
                        name: variant.name,
                        price: variant.price || 0,
                        isActive: variant.isActive !== false,
                        subServiceId: subService.id
                    }
                });
            }
        }

        res.json({ success: true, subService });
    } catch (error) {
        console.error('Ошибка создания комплектации:', error);
        res.status(500).json({ success: false, error: 'Ошибка создания комплектации' });
    }
});

// Обновить комплектацию
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, avatar, photos, video, serviceId, minAge, price, variants } = req.body;

        const updateData: any = {
            name,
            description,
            avatar,
            photos: photos || [],
            video,
            serviceId,
            minAge: minAge || 0,
            price: price || 0
        };

        // Удаляем undefined поля
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const updatedSubService = await prisma.subService.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                variants: true
            }
        });

        // Если есть варианты, обновляем их
        if (variants && variants.length > 0) {
            // Сначала удаляем все существующие варианты
            await prisma.subServiceVariant.deleteMany({
                where: { subServiceId: Number(id) }
            });

            // Создаем новые варианты
            for (const variant of variants) {
                await prisma.subServiceVariant.create({
                    data: {
                        name: variant.name,
                        price: variant.price || 0,
                        isActive: variant.isActive !== false,
                        subServiceId: Number(id)
                    }
                });
            }
        }

        res.json({ success: true, subService: updatedSubService });
    } catch (error) {
        console.error('Ошибка обновления комплектации:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления комплектации' });
    }
});

// Удалить комплектацию
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }

        // Проверяем, есть ли активные заказы с этой комплектацией
        const activeOrders = await prisma.order.findMany({
            where: {
                orderComplectations: {
                    some: {
                        subServiceId: id
                    }
                },
                paymentStatus: 'PENDING'
            }
        });
        if (activeOrders.length > 0) {
            res.status(400).json({
                success: false,
                error: 'Комплектация не может быть удалена, так как она входит в действующий заказ. Удаление возможно только после исполнения заказа или завершения мероприятия.'
            });
            return;
        }

        await prisma.subService.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления комплектации:', error);
        res.status(500).json({ success: false, error: 'Ошибка при удалении комплектации' });
    }
});

// Массовое обновление порядка комплектующих
router.patch('/order', async (req: Request, res: Response) => {
    try {
        const { orders } = req.body; // [{id, order}, ...]
        if (!Array.isArray(orders)) {
            res.status(400).json({ success: false, error: 'orders должен быть массивом' });
            return;
        }
        for (const item of orders) {
            if (!item.id || typeof item.order !== 'number') continue;
            await prisma.subService.update({
                where: { id: Number(item.id) },
                data: { order: item.order },
            });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка массового обновления порядка:', error);
        res.status(500).json({ success: false, error: 'Ошибка при обновлении порядка' });
    }
});

// Получить варианты комплектации
router.get('/:id/variants', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }

        const variants = await prisma.subServiceVariant.findMany({
            where: { subServiceId: id },
            orderBy: { id: 'asc' }
        });

        res.json({ success: true, variants });
    } catch (error) {
        console.error('Ошибка получения вариантов:', error);
        res.status(500).json({ success: false, error: 'Ошибка при получении вариантов' });
    }
});

// Создать вариант комплектации
router.post('/:id/variants', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { name, price, media, videos } = req.body;

        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }
        if (!name) {
            res.status(400).json({ success: false, error: 'Название варианта обязательно' });
            return;
        }
        if (!price || price <= 0) {
            res.status(400).json({ success: false, error: 'Цена должна быть больше 0' });
            return;
        }

        const variant = await prisma.subServiceVariant.create({
            data: {
                name,
                price: Number(price),
                media: media || [],
                videos: videos || [],
                subServiceId: id
            }
        });

        res.status(201).json({ success: true, variant });
    } catch (error) {
        console.error('Ошибка создания варианта:', error);
        res.status(500).json({ success: false, error: 'Ошибка при создании варианта' });
    }
});

// Обновить вариант комплектации
router.put('/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const variantId = Number(req.params['variantId']);
        const { name, price, media, videos, isActive } = req.body;

        if (isNaN(id) || isNaN(variantId)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }

        const variant = await prisma.subServiceVariant.update({
            where: { id: variantId },
            data: {
                name,
                price: Number(price),
                media: media || [],
                videos: videos || [],
                isActive
            }
        });

        res.json({ success: true, variant });
    } catch (error) {
        console.error('Ошибка обновления варианта:', error);
        res.status(500).json({ success: false, error: 'Ошибка при обновлении варианта' });
    }
});

// Удалить вариант комплектации
router.delete('/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const variantId = Number(req.params['variantId']);

        if (isNaN(id) || isNaN(variantId)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }

        await prisma.subServiceVariant.delete({
            where: {
                id: variantId,
                subServiceId: id
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления варианта:', error);
        res.status(500).json({ success: false, error: 'Ошибка при удалении варианта' });
    }
});

export default router; 