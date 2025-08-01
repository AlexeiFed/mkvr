// @ts-nocheck
/**
 * @file: subServices.ts
 * @description: Роутер для CRUD операций с комплектацией (SubService)
 * @dependencies: express, @prisma/client
 * @created: 2024-07-07
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient() as any;

// Получить все комплектации
router.get('/', async (_req: Request, res: Response) => {
    try {
        const subServices = await prisma.subService.findMany({
            include: {
                service: true,
                variants: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { order: 'asc' }
        });

        // Нормализуем все subServices
        subServices.forEach((subService: any) => {
            if (Array.isArray(subService.photos)) {
                subService.photos = subService.photos.map((photo: string) => photo.trim()).filter(Boolean);
            }
        });

        return res.json({ success: true, subServices });
    } catch (error) {
        console.error('Ошибка получения комплектаций:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при получении комплектаций' });
    }
});

// Получить комплектации по услуге
router.get('/service/:serviceId', async (req: Request, res: Response) => {
    try {
        const serviceId = Number(req.params['serviceId']);
        if (isNaN(serviceId)) {
            return res.status(400).json({ success: false, error: 'Некорректный ID услуги' });
        }

        const subServices = await prisma.subService.findMany({
            where: { serviceId },
            include: {
                service: true,
                variants: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { order: 'asc' }
        });

        // Нормализуем все subServices
        subServices.forEach((subService: any) => {
            if (Array.isArray(subService.photos)) {
                subService.photos = subService.photos.map((photo: string) => photo.trim()).filter(Boolean);
            }
        });

        return res.json({ success: true, subServices });
    } catch (error) {
        console.error('Ошибка получения комплектаций услуги:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при получении комплектаций услуги' });
    }
});

// Получить все комплектующие по serviceId
router.get('/service/:serviceId', async (req, res) => {
    const serviceId = parseInt(req.params.serviceId, 10);
    if (isNaN(serviceId)) {
        return res.status(400).json({ success: false, error: 'Некорректный serviceId' });
    }
    try {
        const subServices = await prisma.subService.findMany({
            where: { serviceId, isActive: true }
        });
        return res.json({ success: true, subServices });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении комплектующих' });
    }
});

// Получить комплектацию по id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });

        const subService = await prisma.subService.findUnique({
            where: { id },
            include: {
                service: true,
                variants: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!subService) {
            return res.status(404).json({ success: false, error: 'Комплектация не найдена' });
        }

        // Нормализуем photos
        if (Array.isArray(subService.photos)) {
            subService.photos = subService.photos.map((photo: string) => photo.trim()).filter(Boolean);
        }

        return res.json({ success: true, subService });
    } catch (error) {
        console.error('Ошибка получения комплектации:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при получении комплектации' });
    }
});

// Создать комплектацию
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description, avatar, photos, video, serviceId, minAge, order, hasVariants, variants, price } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Название обязательно' });
        }

        if (!serviceId) {
            return res.status(400).json({ success: false, error: 'ID услуги обязателен' });
        }

        const minAgeValue = minAge ? Number(minAge) : 0;
        const orderValue = order ? Number(order) : 0;
        const priceValue = price ? Number(price) : 0;

        // Проверяем существование услуги
        const service = await prisma.service.findUnique({
            where: { id: Number(serviceId) },
        });

        if (!service) {
            return res.status(404).json({ success: false, error: 'Услуга не найдена' });
        }

        // Создаем комплектацию с вариантами
        const subService = await prisma.subService.create({
            data: {
                name,
                description: description || null,
                avatar: avatar || null,
                photos: photos || [],
                video: video || null,
                serviceId: Number(serviceId),
                minAge: minAgeValue,
                order: orderValue,
                hasVariants: hasVariants || false,
                price: priceValue,
                variants: {
                    create: variants ? variants.map((variant: any) => ({
                        name: variant.name,
                        description: variant.description,
                        price: Number(variant.price),
                        avatar: variant.avatar,
                        photos: variant.photos || [],
                        videos: variant.videos || [], // Изменено с video на videos
                        order: variant.order || 0,
                        isActive: variant.isActive !== false
                    })) : []
                }
            },
            include: {
                service: true,
                variants: {
                    orderBy: { order: 'asc' }
                }
            },
        });

        return res.status(201).json({ success: true, subService });
    } catch (error) {
        console.error('Ошибка создания комплектации:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при создании комплектации' });
    }
});

// Обновить комплектацию
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { name, description, avatar, photos, video, serviceId, minAge, order, hasVariants, variants, price } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Некорректный ID' });
        }

        // Проверяем существование комплектации
        const existingSubService = await prisma.subService.findUnique({
            where: { id },
            include: { variants: true }
        });

        if (!existingSubService) {
            return res.status(404).json({ success: false, error: 'Комплектация не найдена' });
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
                    orderBy: { order: 'asc' }
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
                        orderBy: { order: 'asc' }
                    }
                }
            });

            return res.json({ success: true, subService: updatedSubService });
        }

        return res.json({ success: true, subService });
    } catch (error) {
        console.error('Ошибка обновления комплектации:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при обновлении комплектации' });
    }
});

// Удалить комплектацию
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Некорректный ID' });
        }

        // Проверка наличия активных заказов с этой комплектацией
        const activeOrders = await prisma.orderComplectation.findMany({
            where: {
                subServiceId: id,
                order: {
                    OR: [
                        { status: { notIn: ['completed', 'cancelled'] } },
                        { workshopDate: { gte: new Date() } }
                    ]
                }
            },
            include: { order: true }
        });
        if (activeOrders.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Комплектация не может быть удалена, так как она входит в действующий заказ. Удаление возможно только после исполнения заказа или завершения мероприятия.'
            });
        }

        await prisma.subService.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления комплектации:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при удалении комплектации' });
    }
});

// Массовое обновление порядка комплектующих
router.patch('/order', async (req: Request, res: Response) => {
    try {
        const { orders } = req.body; // [{id, order}, ...]
        if (!Array.isArray(orders)) {
            return res.status(400).json({ success: false, error: 'orders должен быть массивом' });
        }
        for (const item of orders) {
            if (!item.id || typeof item.order !== 'number') continue;
            await prisma.subService.update({
                where: { id: Number(item.id) },
                data: { order: item.order },
            });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Ошибка массового обновления порядка:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при обновлении порядка' });
    }
});

// Получить варианты комплектации
router.get('/:id/variants', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });

        const variants = await prisma.subServiceVariant.findMany({
            where: { subServiceId: id },
            orderBy: { order: 'asc' }
        });

        return res.json({ success: true, variants });
    } catch (error) {
        console.error('Ошибка получения вариантов:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при получении вариантов' });
    }
});

// Создать вариант комплектации
router.post('/:id/variants', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { name, description, price, order } = req.body;

        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        if (!name) return res.status(400).json({ success: false, error: 'Название варианта обязательно' });
        if (!price || price <= 0) return res.status(400).json({ success: false, error: 'Цена должна быть больше 0' });

        const variant = await prisma.subServiceVariant.create({
            data: {
                subServiceId: id,
                name,
                description: description || null,
                price: Number(price),
                order: order || 0
            }
        });

        return res.status(201).json({ success: true, variant });
    } catch (error) {
        console.error('Ошибка создания варианта:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при создании варианта' });
    }
});

// Обновить вариант комплектации
router.put('/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const variantId = Number(req.params['variantId']);
        const { name, description, price, order, isActive } = req.body;

        if (isNaN(id) || isNaN(variantId)) {
            return res.status(400).json({ success: false, error: 'Некорректный ID' });
        }

        const variant = await prisma.subServiceVariant.update({
            where: {
                id: variantId,
                subServiceId: id // Проверяем, что вариант принадлежит этой комплектации
            },
            data: {
                name,
                description,
                price: price ? Number(price) : undefined,
                order,
                isActive
            }
        });

        return res.json({ success: true, variant });
    } catch (error) {
        console.error('Ошибка обновления варианта:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при обновлении варианта' });
    }
});

// Удалить вариант комплектации
router.delete('/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const variantId = Number(req.params['variantId']);

        if (isNaN(id) || isNaN(variantId)) {
            return res.status(400).json({ success: false, error: 'Некорректный ID' });
        }

        await prisma.subServiceVariant.delete({
            where: {
                id: variantId,
                subServiceId: id
            }
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления варианта:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при удалении варианта' });
    }
});

export default router; 