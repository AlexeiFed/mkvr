/**
 * @file: users.ts
 * @description: Роуты для управления пользователями (админ)
 * @dependencies: express, prisma
 * @created: 2025-07-25
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Получить всех пользователей с фильтрами
router.get('/', async (req: Request, res: Response) => {
    try {
        const { schoolId, classId, role, page = 1, pageSize = 20 } = req.query;
        const where: any = {};
        if (schoolId) where.schoolId = Number(schoolId);
        if (classId) where.classId = Number(classId);
        if (role) where.role = role;

        const skip = (Number(page) - 1) * Number(pageSize);
        const users = await prisma.user.findMany({
            where,
            skip,
            take: Number(pageSize),
            orderBy: { createdAt: 'desc' },
        });
        const total = await prisma.user.count({ where });
        res.json({ users, total });
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

// Получить детальную информацию о пользователе
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ error: 'Некорректный ID' });
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
        return res.json({ user });
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        return res.status(500).json({ error: 'Ошибка получения пользователя' });
    }
});

// Удалить пользователя
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ error: 'Некорректный ID' });
        await prisma.user.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        return res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
});

export default router; 