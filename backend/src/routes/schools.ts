/**
 * @file: schools.ts
 * @description: Маршруты для работы со школами и классами
 * @dependencies: express, prisma
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/schools - Получить все школы
router.get('/', async (req: Request, res: Response) => {
    try {
        console.log('🔍 Запрос на получение школ');
        console.log('📋 Окружение:', process.env.NODE_ENV);
        console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'Настроен' : 'НЕ НАСТРОЕН');

        const schools = await prisma.school.findMany();

        console.log(`✅ Найдено школ: ${schools.length}`);
        res.json({ success: true, schools });
    } catch (error) {
        console.error('❌ Ошибка получения школ:', error);
        console.error('📋 Детали ошибки:', {
            message: (error as Error).message,
            name: (error as Error).name,
            stack: (error as Error).stack
        });
        console.error('📋 DATABASE_URL:', process.env.DATABASE_URL);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения школ',
            message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Произошла ошибка при получении школ'
        });
    }
});

// GET /api/schools/:id - Получить школу по ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const school = await prisma.school.findUnique({
            where: { id: parseInt(id) }
        });

        if (!school) {
            res.status(404).json({ success: false, error: 'Школа не найдена' });
            return;
        }

        res.json({ success: true, school });
    } catch (error) {
        console.error('Ошибка получения школы:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения школы' });
    }
});

// POST /api/schools - Создать школу
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, address } = req.body;

        if (!name || !address) {
            res.status(400).json({ success: false, error: 'Название и адрес обязательны' });
            return;
        }

        const school = await prisma.school.create({
            data: {
                name,
                address
            }
        });

        res.status(201).json({ success: true, school });
    } catch (error) {
        console.error('Ошибка создания школы:', error);
        res.status(500).json({ success: false, error: 'Ошибка создания школы' });
    }
});

// PUT /api/schools/:id - Обновить школу
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, address, isActive } = req.body;

        const school = await prisma.school.update({
            where: { id: parseInt(id) },
            data: {
                name,
                address,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.json({ success: true, school });
    } catch (error) {
        console.error('Ошибка обновления школы:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления школы' });
    }
});

// DELETE /api/schools/:id - Удалить школу
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.school.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Школа удалена' });
    } catch (error) {
        console.error('Ошибка удаления школы:', error);
        res.status(500).json({ success: false, error: 'Ошибка удаления школы' });
    }
});

// GET /api/schools/:schoolId/classes - Получить классы школы
router.get('/:schoolId/classes', async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const classes = await prisma.class.findMany({
            where: { schoolId: parseInt(schoolId) },
            select: {
                id: true,
                name: true,
                phone: true,
                teacher: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json({ success: true, classes });
    } catch (error) {
        console.error('Ошибка получения классов:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения классов' });
    }
});

// GET /api/schools/classes - Получить все классы всех школ
router.get('/classes/all', async (req: Request, res: Response) => {
    try {
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                name: true,
                schoolId: true,
                phone: true,
                teacher: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json({ success: true, classes });
    } catch (error) {
        console.error('Ошибка получения всех классов:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения классов' });
    }
});

// POST /api/schools/:schoolId/classes - Создать класс
router.post('/:schoolId/classes', async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.params;
        const { name, phone, teacher } = req.body;

        if (!name) {
            res.status(400).json({ success: false, error: 'Название класса обязательно' });
            return;
        }

        const classData = await prisma.class.create({
            data: {
                name,
                phone: phone || null,
                teacher: teacher || null,
                schoolId: parseInt(schoolId)
            }
        });

        res.status(201).json({ success: true, class: classData });
    } catch (error) {
        console.error('Ошибка создания класса:', error);
        res.status(500).json({ success: false, error: 'Ошибка создания класса' });
    }
});

// PUT /api/schools/:schoolId/classes/:classId - Обновить класс
router.put('/:schoolId/classes/:classId', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { name, phone, teacher } = req.body;

        const classData = await prisma.class.update({
            where: { id: parseInt(classId) },
            data: {
                name,
                phone: phone || null,
                teacher: teacher || null
            }
        });

        res.json({ success: true, class: classData });
    } catch (error) {
        console.error('Ошибка обновления класса:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления класса' });
    }
});

// DELETE /api/schools/:schoolId/classes/:classId - Удалить класс
router.delete('/:schoolId/classes/:classId', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        await prisma.class.delete({
            where: { id: parseInt(classId) }
        });

        res.json({ success: true, message: 'Класс удален' });
    } catch (error) {
        console.error('Ошибка удаления класса:', error);
        res.status(500).json({ success: false, error: 'Ошибка удаления класса' });
    }
});

export default router; 