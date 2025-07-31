/**
 * @file: schools.ts
 * @description: Роутер для CRUD операций со школами (School) с классами и сменами
 * @dependencies: express, @prisma/client
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient() as any;

// Получить все школы с классами
router.get('/', async (_req: Request, res: Response) => {
    try {
        const schools = await prisma.school.findMany({
            include: {
                classes: true,
            },
        });
        return res.json({ success: true, schools });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении школ' });
    }
});

// Получить список школ для фильтра
router.get('/list', async (_req: Request, res: Response) => {
    try {
        const schools = await prisma.school.findMany({
            select: {
                id: true,
                name: true,
                address: true
            },
            where: {
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.json({ success: true, schools });
    } catch (error) {
        console.error('Ошибка получения списка школ:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при получении списка школ' });
    }
});

// Получить все города из адресов школ
router.get('/cities', async (_req: Request, res: Response) => {
    try {
        const schools = await prisma.school.findMany({
            select: {
                address: true
            },
            where: {
                isActive: true
            }
        });

        // Извлекаем города из адресов (до первой запятой)
        const cities = schools
            .map((school: { address: string }) => {
                const city = school.address.split(',')[0]?.trim() || '';
                return city;
            })
            .filter((city: string, index: number, arr: string[]) => arr.indexOf(city) === index) // Убираем дубликаты
            .sort(); // Сортируем по алфавиту

        return res.json({ success: true, cities });
    } catch (error) {
        console.error('Ошибка получения городов:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при получении городов' });
    }
});

// Получить список классов для фильтра
router.get('/classes', async (_req: Request, res: Response) => {
    try {
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                name: true,
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                {
                    school: {
                        name: 'asc'
                    }
                },
                {
                    name: 'asc'
                }
            ]
        });
        return res.json({ success: true, classes });
    } catch (error) {
        console.error('Ошибка получения списка классов:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при получении списка классов' });
    }
});

// Получить школу по id с классами
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        const school = await prisma.school.findUnique({
            where: { id },
            include: {
                classes: true,
            },
        });
        if (!school) return res.status(404).json({ success: false, error: 'Школа не найдена' });
        return res.json({ success: true, school });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении школы' });
    }
});

// Создать школу
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, address, note, isActive } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Название обязательно' });
        if (!address) return res.status(400).json({ success: false, error: 'Адрес обязателен' });

        const school = await prisma.school.create({
            data: {
                name,
                address,
                note: note || null,
                isActive: isActive !== false
            },
        });
        return res.status(201).json({ success: true, school });
    } catch (error) {
        console.error('Ошибка создания школы:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при создании школы' });
    }
});

// Обновить школу
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        const { name, address, note, isActive } = req.body;
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (address !== undefined) updateData.address = address;
        if (note !== undefined) updateData.note = note || null;
        if (isActive !== undefined) updateData.isActive = isActive;

        const school = await prisma.school.update({
            where: { id },
            data: updateData,
        });
        return res.json({ success: true, school });
    } catch (error) {
        console.error('Ошибка обновления школы:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при обновлении школы' });
    }
});

// Удалить школу
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params['id']);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'Некорректный ID' });
        await prisma.school.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при удалении школы' });
    }
});

// Получить классы школы
router.get('/:id/classes', async (req: Request, res: Response) => {
    try {
        const schoolId = Number(req.params['id']);
        if (isNaN(schoolId)) return res.status(400).json({ success: false, error: 'Некорректный ID школы' });
        const classes = await prisma.class.findMany({
            where: { schoolId },
        });
        return res.json({ success: true, classes });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении классов' });
    }
});

// Создать класс для школы
router.post('/:id/classes', async (req: Request, res: Response) => {
    try {
        const schoolId = Number(req.params['id']);
        const { name, shift, teacher, phone, note } = req.body;
        if (isNaN(schoolId)) return res.status(400).json({ success: false, error: 'Некорректный ID школы' });
        if (!name) return res.status(400).json({ success: false, error: 'Название класса обязательно' });

        const classItem = await prisma.class.create({
            data: {
                name,
                shift: shift || null,
                teacher: teacher || null,
                phone: phone || null,
                note: note || null,
                schoolId
            },
        });
        return res.status(201).json({ success: true, class: classItem });
    } catch (error) {
        console.error('Ошибка создания класса:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при создании класса' });
    }
});

// Получить смены школы (через классы)
router.get('/:id/shifts', async (req: Request, res: Response) => {
    try {
        const schoolId = Number(req.params['id']);
        if (isNaN(schoolId)) return res.status(400).json({ success: false, error: 'Некорректный ID школы' });
        const classes = await prisma.class.findMany({
            where: { schoolId },
            include: {
                shifts: true,
            },
        });
        const shifts = classes.flatMap((cls: any) => cls.shifts);
        return res.json({ success: true, shifts });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Ошибка при получении смен' });
    }
});



export default router; 