// @ts-nocheck
/**
 * @file: classes.ts
 * @description: Роутер для CRUD операций с классами (Class)
 * @dependencies: express, @prisma/client
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient() as any;

// Получить все классы с информацией о школе
router.get('/', async (_req: Request, res: Response) => {
    try {
        const classes = await prisma.class.findMany({
            include: {
                school: true,
            },
        });
        return res.json({ success: true, classes });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении классов' });
    }
});

// Получить класс по id с информацией о школе
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        const classItem = await prisma.class.findUnique({
            where: { id },
            include: {
                school: true,
            },
        });
        if (!classItem) return res.status(404).json({ success: false, error: 'Класс не найден' });
        return res.json({ success: true, class: classItem });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении класса' });
    }
});

// Создать класс
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, note, schoolId } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Название обязательно' });
        if (!schoolId) return res.status(400).json({ success: false, error: 'ID школы обязателен' });
        const classItem = await prisma.class.create({
            data: { name, note, schoolId: Number(schoolId) },
        });
        return res.status(201).json({ success: true, class: classItem });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при создании класса' });
    }
});

// Обновить класс
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { name, shift, teacher, phone, note, schoolId } = req.body;
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (shift !== undefined) updateData.shift = shift || null;
        if (teacher !== undefined) updateData.teacher = teacher || null;
        if (phone !== undefined) updateData.phone = phone || null;
        if (note !== undefined) updateData.note = note || null;
        if (schoolId !== undefined) updateData.schoolId = Number(schoolId);

        const classItem = await prisma.class.update({
            where: { id },
            data: updateData,
        });
        return res.json({ success: true, class: classItem });
    } catch (error) {
        console.error('Ошибка обновления класса:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при обновлении класса' });
    }
});

// Удалить класс
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        await prisma.class.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при удалении класса' });
    }
});

export default router; 