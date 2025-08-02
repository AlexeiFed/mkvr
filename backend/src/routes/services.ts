/**
 * @file: services.ts
 * @description: Роутер для CRUD операций с услугами (Service)
 * @dependencies: express, @prisma/client
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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
                            orderBy: { id: 'asc' }
                        }
                    },
                    orderBy: { id: 'asc' }
                },
            },
        });
        // Нормализуем все subServices
        services.forEach((service: any) => {
            if (Array.isArray(service.subServices)) {
                service.subServices = service.subServices.map(normalizePhotosField);
            }
        });
        res.json({ success: true, services });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при получении услуг' });
    }
});

// Получить услугу по id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }
        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                subServices: {
                    include: {
                        variants: {
                            orderBy: { id: 'asc' }
                        }
                    },
                    orderBy: { id: 'asc' }
                },
            },
        });
        if (!service) {
            res.status(404).json({ success: false, error: 'Услуга не найдена' });
            return;
        }
        if (Array.isArray(service.subServices)) {
            service.subServices = service.subServices.map(normalizePhotosField);
        }
        res.json({ success: true, service });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при получении услуги' });
    }
});

// Создать услугу
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description, isActive } = req.body;
        if (!name) {
            res.status(400).json({ success: false, error: 'Название обязательно' });
            return;
        }
        const service = await prisma.service.create({
            data: {
                name,
                description: description || null,
                isActive: isActive !== false
            }
        });
        res.status(201).json({ success: true, service });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при создании услуги' });
    }
});

// Обновить услугу
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { name, description, isActive } = req.body;
        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }
        const service = await prisma.service.update({
            where: { id },
            data: { name, description, isActive },
        });
        res.json({ success: true, service });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при обновлении услуги' });
    }
});

// Удалить услугу
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'Некорректный ID' });
            return;
        }
        await prisma.service.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при удалении услуги' });
    }
});

export default router; 