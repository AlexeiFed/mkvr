/**
 * @file: subServices.ts
 * @description: Маршруты для работы с комплектациями (SubService)
 * @dependencies: express, prisma
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../types/express';

const router = Router();
const prisma = new PrismaClient();

// GET /api/subServices - Получить все комплектации
router.get('/', async (req: Request, res: Response) => {
    try {
        const subServices = await prisma.subService.findMany({
            include: {
                service: true,
                variants: true
            }
        });
        res.json({ success: true, subServices });
    } catch (error) {
        console.error('Ошибка получения комплектаций:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения комплектаций' });
    }
});

// GET /api/subServices/:id - Получить комплектацию по ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const subService = await prisma.subService.findUnique({
            where: { id: parseInt(id) },
            include: {
                service: true,
                variants: true
            }
        });

        if (!subService) {
            res.status(404).json({ success: false, error: 'Комплектация не найдена' });
            return;
        }

        res.json({ success: true, subService });
    } catch (error) {
        console.error('Ошибка получения комплектации:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения комплектации' });
    }
});

// GET /api/subServices/service/:serviceId - Получить комплектации услуги
router.get('/service/:serviceId', async (req: Request, res: Response) => {
    try {
        const { serviceId } = req.params;
        const subServices = await prisma.subService.findMany({
            where: { serviceId: parseInt(serviceId) },
            include: {
                variants: true
            },
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, subServices });
    } catch (error) {
        console.error('Ошибка получения комплектаций услуги:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения комплектаций услуги' });
    }
});

// POST /api/subServices - Создать комплектацию
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

// PUT /api/subServices/:id - Обновить комплектацию
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
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                variants: true
            }
        });

        // Если есть варианты, обновляем их
        if (variants && variants.length > 0) {
            // Сначала удаляем все существующие варианты
            await prisma.subServiceVariant.deleteMany({
                where: { subServiceId: parseInt(id) }
            });

            // Создаем новые варианты
            for (const variant of variants) {
                await prisma.subServiceVariant.create({
                    data: {
                        name: variant.name,
                        price: variant.price || 0,
                        isActive: variant.isActive !== false,
                        subServiceId: parseInt(id)
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

// DELETE /api/subServices/:id - Удалить комплектацию
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Проверяем, есть ли уже заказы с этой комплектацией
        const existingOrders = await prisma.order.findMany({
            where: {
                orderComplectations: {
                    some: {
                        subServiceId: parseInt(id)
                    }
                },
                paymentStatus: 'pending'
            }
        });
        if (existingOrders.length > 0) {
            res.status(400).json({
                success: false,
                error: 'Нельзя удалить комплектацию, которая используется в активных заказах'
            });
            return;
        }

        await prisma.subService.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Комплектация удалена' });
    } catch (error) {
        console.error('Ошибка удаления комплектации:', error);
        res.status(500).json({ success: false, error: 'Ошибка удаления комплектации' });
    }
});

export default router; 