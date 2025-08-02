/**
 * @file: auth.ts
 * @description: Роутер для аутентификации пользователей
 * @dependencies: express, bcryptjs, jsonwebtoken, @prisma/client
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';
const SALT_ROUNDS = 10;

// POST /api/auth/register - Регистрация нового пользователя
router.post('/register', async (req: Request, res: Response) => {
    try {
        const {
            email,
            firstName,
            lastName,
            password,
            role = 'CHILD',
            age,
            schoolId,
            classId,
            shift,
            childFirstName,
            childLastName,
            childAge
        } = req.body;

        // Базовая валидация
        if (!email || !firstName || !lastName || !password) {
            res.status(400).json({
                success: false,
                error: 'Email, имя, фамилия и пароль обязательны'
            });
            return;
        }

        // Логирование возраста для отладки
        console.log('age:', age, typeof age);
        const ageNum = Number(age);
        if (isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum <= 0) {
            res.status(400).json({
                success: false,
                error: 'Возраст обязателен и должен быть положительным целым числом'
            });
            return;
        }

        // Валидация для роли child
        if (role === 'CHILD') {
            if (!schoolId || !classId || !shift) {
                res.status(400).json({
                    success: false,
                    error: 'Для роли "ребенок" обязательны поля: школа, класс, смена'
                });
                return;
            }
        }

        // Валидация полей для родителя
        if (role === 'PARENT') {
            if (!schoolId || !classId || !shift) {
                res.status(400).json({
                    success: false,
                    error: 'Для роли "родитель" обязательны поля: школа, класс, смена'
                });
                return;
            }
            if (!childFirstName || !childLastName || !childAge) {
                res.status(400).json({
                    success: false,
                    error: 'Для роли "родитель" обязательны поля: имя ребенка, фамилия ребенка, возраст ребенка'
                });
                return;
            }
            if (typeof childAge !== 'number' || !Number.isInteger(childAge) || childAge <= 0 || childAge > 18) {
                res.status(400).json({
                    success: false,
                    error: 'Возраст ребенка должен быть положительным целым числом от 1 до 18'
                });
                return;
            }
        }

        // Проверка длины пароля
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                error: 'Пароль должен содержать минимум 6 символов'
            });
            return;
        }

        // Проверка существования пользователя
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({
                success: false,
                error: 'Пользователь с таким email уже существует'
            });
            return;
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Создание пользователя в транзакции
        const result = await prisma.$transaction(async (tx) => {
            // Создаем основного пользователя
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role,
                    age: ageNum,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    age: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            let childUser = null;

            // Если это родитель, создаем ребенка
            if (role === 'PARENT') {
                childUser = await tx.user.create({
                    data: {
                        email: `${childFirstName.toLowerCase()}.${childLastName.toLowerCase()}@child.local`,
                        password: await bcrypt.hash('child123', SALT_ROUNDS),
                        firstName: childFirstName,
                        lastName: childLastName,
                        role: 'child' as any,
                        age: childAge,
                    },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        age: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
            }

            return { user, childUser };
        });

        // Генерация JWT токена
        const token = jwt.sign(
            {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Отправляем WebSocket событие о регистрации нового пользователя
        if (req.app.get('io')) {
            const io = req.app.get('io');
            if (io) {
                io.emit('user:registered', {
                    user: result.user,
                    childUser: result.childUser
                });
            }
        }

        res.status(201).json({
            success: true,
            user: result.user,
            childUser: result.childUser,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при регистрации'
        });
    }
});

// POST /api/auth/login - Вход пользователя
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Базовая валидация
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email и пароль обязательны'
            });
            return;
        }

        // Поиск пользователя
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Неверный email или пароль'
            });
            return;
        }

        // Проверка пароля
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({
                success: false,
                error: 'Неверный email или пароль'
            });
            return;
        }

        // Генерация JWT токена
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Возврат данных пользователя (без пароля)
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            age: user.age,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        res.json({
            success: true,
            user: userData,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при входе'
        });
    }
});

// GET /api/auth/me - Получение данных текущего пользователя
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
    try {
        console.log('[auth/me] req.user:', req.user);
        const userId = req.user?.id;

        if (!userId) {
            console.log('[auth/me] No userId found');
            res.status(401).json({
                success: false,
                error: 'Требуется аутентификация'
            });
            return;
        }

        console.log('[auth/me] Looking for user with id:', userId);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                age: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        console.log('[auth/me] Found user:', user);

        if (!user) {
            console.log('[auth/me] User not found');
            res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
            return;
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('[auth/me] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении данных пользователя'
        });
    }
});

// POST /api/auth/logout - Выход пользователя (на клиенте удаляется токен)
router.post('/logout', authenticateToken, async (_req: Request, res: Response) => {
    try {
        // В JWT аутентификации выход происходит на клиенте
        // Здесь можно добавить логику для blacklist токенов если нужно
        res.json({
            success: true,
            message: 'Выход выполнен успешно'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка при выходе'
        });
    }
});

export default router; 