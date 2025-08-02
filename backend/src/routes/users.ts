// @ts-nocheck
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
        const { school, grade, city, role, page = 1, pageSize = 20 } = req.query;
        const where: any = {};
        if (role) where.role = role;

        const skip = (Number(page) - 1) * Number(pageSize);
        const users = await prisma.user.findMany({
            where,
            skip,
            take: Number(pageSize),
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                city: true,
                school: true,
                grade: true,
                shift: true,
                age: true,
                createdAt: true,
                updatedAt: true,
                // Получаем актуальные данные через мастер-классы
                ordersAsChild: {
                    select: {
                        workshop: {
                            select: {
                                school: {
                                    select: {
                                        id: true,
                                        name: true,
                                        address: true
                                    }
                                },
                                class: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        // Обрабатываем данные, чтобы показать актуальную школу и класс
        let processedUsers = users.map(user => {
            const latestOrder = user.ordersAsChild?.[0];
            const actualSchool = latestOrder?.workshop?.school?.name || user.school;
            const actualGrade = latestOrder?.workshop?.class?.name || user.grade;

            return {
                ...user,
                school: actualSchool,
                grade: actualGrade,
                schoolId: latestOrder?.workshop?.school?.id || null,
                classId: latestOrder?.workshop?.class?.id || null,
                schoolAddress: latestOrder?.workshop?.school?.address || null,
                ordersAsChild: undefined // Убираем из ответа
            };
        });

        // Фильтруем по школе, если указан фильтр
        if (school) {
            const schoolId = Number(school);
            processedUsers = processedUsers.filter(user => user.schoolId === schoolId);
        }

        // Фильтруем по классу, если указан фильтр
        if (grade) {
            const classId = Number(grade);
            processedUsers = processedUsers.filter(user => user.classId === classId);
        }

        // Фильтруем по городу, если указан фильтр
        if (city) {
            processedUsers = processedUsers.filter(user =>
                user.schoolAddress?.toLowerCase().includes(String(city).toLowerCase())
            );
        }

        const total = await prisma.user.count({ where });

        return res.json({
            success: true,
            users: processedUsers,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize))
            }
        });
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при получении пользователей'
        });
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

        // Получаем информацию о пользователе перед удалением
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, firstName: true, lastName: true }
        });

        await prisma.user.delete({ where: { id } });

        // Отправляем WebSocket событие о удалении пользователя
        if (req.app.get('io')) {
            const io = req.app.get('io');
            if (io) {
                io.emit('user:deleted', { userId: id, user });
            }
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        return res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
});

export default router; 