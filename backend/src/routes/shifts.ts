// @ts-nocheck
/**
 * @file: shifts.ts
 * @description: Роутер для CRUD операций со сменами (Shift)
 * @dependencies: express, @prisma/client
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient() as any;

// Получить все смены с информацией о школе
router.get('/', async (_req: Request, res: Response) => {
    try {
        const shifts = await prisma.shift.findMany({
            include: {
                class: {
                    include: {
                        school: true,
                    },
                },
            },
        });
        return res.json({ success: true, shifts });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении смен' });
    }
});

// Получить смену по id с информацией о школе
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        const shift = await prisma.shift.findUnique({
            where: { id },
            include: {
                class: {
                    include: {
                        school: true,
                    },
                },
            },
        });
        if (!shift) return res.status(404).json({ success: false, error: 'Смена не найдена' });
        return res.json({ success: true, shift });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении смены' });
    }
});

// Создать смену
router.post('/', async (req: Request, res: Response) => {
    try {
        const { number, note, classId } = req.body;
        if (!number) return res.status(400).json({ success: false, error: 'Номер смены обязателен' });
        if (!classId) return res.status(400).json({ success: false, error: 'ID класса обязателен' });
        const shift = await prisma.shift.create({
            data: { number: Number(number), note, classId: Number(classId) },
        });
        return res.status(201).json({ success: true, shift });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при создании смены' });
    }
});

// Обновить смену
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { number, note, classId } = req.body;
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        const shift = await prisma.shift.update({
            where: { id },
            data: { number: number ? Number(number) : undefined, note, classId: classId ? Number(classId) : undefined },
        });
        return res.json({ success: true, shift });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при обновлении смены' });
    }
});

// Удалить смену
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        await prisma.shift.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при удалении смены' });
    }
});

export default router; 