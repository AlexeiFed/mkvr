/**
 * @file: services.ts
 * @description: Роутер для CRUD операций с услугами (Service)
 * @dependencies: express, @prisma/client
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient() as any;

// Добавить функцию нормализации
function normalizePhotosField(subService: any) {
    if (subService && typeof subService.photos === 'string') {
        subService.photos = subService.photos.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return subService;
}

// Получить все услуги
router.get('/', async (_req: Request, res: Response) => {
    try {
        const services = await prisma.service.findMany({
            include: {
                subServices: {
                    include: {
                        variants: {
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
            },
        });
        // Нормализуем все subServices
        services.forEach((service: any) => {
            if (Array.isArray(service.subServices)) {
                service.subServices = service.subServices.map(normalizePhotosField);
            }
        });
        return res.json({ success: true, services });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении услуг' });
    }
});

// Получить услугу по id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                subServices: {
                    include: {
                        variants: {
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
            },
        });
        if (!service) return res.status(404).json({ success: false, error: 'Услуга не найдена' });
        if (Array.isArray(service.subServices)) {
            service.subServices = service.subServices.map(normalizePhotosField);
        }
        return res.json({ success: true, service });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении услуги' });
    }
});

// Создать услугу
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description, isActive } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Название обязательно' });
        const service = await prisma.service.create({
            data: { name, description, isActive: isActive !== false },
        });
        return res.status(201).json({ success: true, service });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при создании услуги' });
    }
});

// Обновить услугу
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { name, description, isActive } = req.body;
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        const service = await prisma.service.update({
            where: { id },
            data: { name, description, isActive },
        });
        return res.json({ success: true, service });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при обновлении услуги' });
    }
});

// Удалить услугу
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        await prisma.service.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при удалении услуги' });
    }
});

export default router; 