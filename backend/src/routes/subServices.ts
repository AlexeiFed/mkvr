/**
 * @file: subServices.ts
 * @description: Роутер для CRUD операций с комплектацией (SubService)
 * @dependencies: express, @prisma/client
 * @created: 2024-07-07
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, serviceId, minAge, order, variants, price } = req.body;

        if (!name) {
            res.status(400).json({ success: false, error: 'Название обязательно' });
            return;
        }

        if (!serviceId) {
            res.status(400).json({ success: false, error: 'ID услуги обязателен' });
            return;
        }

        const minAgeValue = minAge ? Number(minAge) : 0;
        const orderValue = order ? Number(order) : 0;
        const priceValue = price ? Number(price) : 0;

        // Проверяем существование услуги
        const service = await prisma.service.findUnique({
            where: { id: Number(serviceId) },
        });

        if (!service) {
            res.status(404).json({ success: false, error: 'Услуга не найдена' });
            return;
        }

        // Создаем комплектацию с вариантами
        const subService = await prisma.subService.create({
            data: {
                name,
                serviceId: Number(serviceId),
                minAge: minAgeValue,
                order: orderValue,
                price: priceValue,
                variants: {
                    create: variants ? variants.map((variant: any) => ({
                        name: variant.name,
                        price: Number(variant.price) || 0,
                        media: Array.isArray(variant.media) ? variant.media : [],
                        videos: Array.isArray(variant.videos) ? variant.videos : [],
                        isActive: variant.isActive !== false
                    })) : []
                }
            },
            include: {
                service: true,
                variants: {
                    orderBy: { id: 'asc' }
                }
            },
        });

        res.status(201).json({ success: true, subService });
    } catch (error) {
        console.error('Ошибка создания комплектации:', error);
        res.status(500).json({ success: false, error: 'Ошибка при создании комплектации' });
    }
});

// Обновить комплектацию
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { name, description, avatar, photos, video, serviceId, minAge, order, hasVariants, variants, price } = req.body;

        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }

        // Проверяем существование комплектации
        const existingSubService = await prisma.subService.findUnique({
            where: { id },
            include: { variants: true }
        });

        if (!existingSubService) {
            res.status(404).json({ success: false, error: 'Комплектация не найдена' });
            return;
        }

        // Обновляем основную информацию
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (photos !== undefined) updateData.photos = photos;
        if (video !== undefined) updateData.video = video;
        if (serviceId !== undefined) updateData.serviceId = Number(serviceId);
        if (minAge !== undefined) updateData.minAge = Number(minAge);
        if (order !== undefined) updateData.order = Number(order);
        if (hasVariants !== undefined) updateData.hasVariants = hasVariants;
        if (price !== undefined) updateData.price = Number(price);

        const subService = await prisma.subService.update({
            where: { id },
            data: updateData,
            include: {
                service: true,
                variants: {
                    orderBy: { id: 'asc' }
                }
            }
        });

        // Если переданы варианты, обновляем их
        if (variants && Array.isArray(variants)) {
            // Удаляем старые варианты
            await prisma.subServiceVariant.deleteMany({
                where: { subServiceId: id }
            });

            // Создаем новые варианты
            if (variants.length > 0) {
                await prisma.subServiceVariant.createMany({
                    data: variants.map((variant: any) => ({
                        subServiceId: id,
                        name: variant.name,
                        description: variant.description,
                        price: Number(variant.price),
                        avatar: variant.avatar,
                        photos: variant.photos || [],
                        videos: variant.videos || [], // Изменено с video на videos
                        order: variant.order || 0,
                        isActive: variant.isActive !== false
                    }))
                });
            }

            // Получаем обновленную комплектацию с вариантами
            const updatedSubService = await prisma.subService.findUnique({
                where: { id },
                include: {
                    service: true,
                    variants: {
                        orderBy: { id: 'asc' }
                    }
                }
            });

            res.json({ success: true, subService: updatedSubService });
        }

        res.json({ success: true, subService });
    } catch (error) {
        console.error('Ошибка обновления комплектации:', error);
        res.status(500).json({ success: false, error: 'Ошибка при обновлении комплектации' });
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