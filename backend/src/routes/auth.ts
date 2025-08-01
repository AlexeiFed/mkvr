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
            role = 'child',
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
            return res.status(400).json({
                success: false,
                error: 'Email, имя, фамилия и пароль обязательны'
            });
        }

        // Логирование возраста для отладки
        console.log('age:', age, typeof age);
        const ageNum = Number(age);
        if (isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Возраст обязателен и должен быть положительным целым числом'
            });
        }

        // Валидация для роли child
        if (role === 'child') {
            if (!schoolId || !classId || !shift) {
                return res.status(400).json({
                    success: false,
                    error: 'Для роли "ребенок" обязательны поля: школа, класс, смена'
                });
            }
        }

        // Валидация полей для родителя
        if (role === 'parent') {
            if (!schoolId || !classId || !shift) {
                return res.status(400).json({
                    success: false,
                    error: 'Для роли "родитель" обязательны поля: школа, класс, смена'
                });
            }
            if (!childFirstName || !childLastName || !childAge) {
                return res.status(400).json({
                    success: false,
                    error: 'Для роли "родитель" обязательны поля: имя ребенка, фамилия ребенка, возраст ребенка'
                });
            }
            if (typeof childAge !== 'number' || !Number.isInteger(childAge) || childAge <= 0 || childAge > 18) {
                return res.status(400).json({
                    success: false,
                    error: 'Возраст ребенка должен быть положительным целым числом от 1 до 18'
                });
            }
        }

        // Проверка длины пароля
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Пароль должен содержать минимум 6 символов'
            });
        }

        // Проверка существования пользователя
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Пользователь с таким email уже существует'
            });
        }

        // Проверка существования школы и класса (для ролей ребенок и родитель)
        if (role === 'child' || role === 'parent') {
            const school = await prisma.school.findUnique({
                where: { id: schoolId },
            });
            if (!school) {
                return res.status(400).json({
                    success: false,
                    error: 'Школа не найдена'
                });
            }

            const classItem = await prisma.class.findUnique({
                where: { id: classId },
            });
            if (!classItem) {
                return res.status(400).json({
                    success: false,
                    error: 'Класс не найден'
                });
            }

            if (classItem.schoolId !== schoolId) {
                return res.status(400).json({
                    success: false,
                    error: 'Класс не принадлежит выбранной школе'
                });
            }
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Создание пользователя в транзакции
        const result = await prisma.$transaction(async (tx) => {
            // Создание основного пользователя
            const user = await tx.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    password: hashedPassword,
                    role,
                    age: ageNum,
                    school: schoolId ? schoolId.toString() : null,
                    grade: classId ? classId.toString() : null,
                    shift: shift || null,
                },
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
                },
            });

            // Создание ребенка при регистрации родителя
            let childUser = null;
            if (role === 'parent' && childFirstName && childLastName && childAge) {
                // Генерируем email для ребенка на основе данных родителя
                const childEmail = `child_${user.id}_${Date.now()}@temp.local`;

                childUser = await tx.user.create({
                    data: {
                        email: childEmail,
                        firstName: childFirstName,
                        lastName: childLastName,
                        password: await bcrypt.hash('temp_password_' + Date.now(), SALT_ROUNDS), // временный пароль
                        role: 'child',
                        age: childAge,
                        school: schoolId ? schoolId.toString() : null,
                        grade: classId ? classId.toString() : null,
                        shift: shift || null,
                    },
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
                role: result.user.role.toLowerCase()
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

        return res.status(201).json({
            success: true,
            user: result.user,
            childUser: result.childUser,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
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
            return res.status(400).json({
                success: false,
                error: 'Email и пароль обязательны'
            });
        }

        // Поиск пользователя
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Неверный email или пароль'
            });
        }

        // Проверка пароля
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Неверный email или пароль'
            });
        }

        // Генерация JWT токена
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role.toLowerCase()
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
            phone: user.phone,
            city: user.city,
            school: user.school,
            grade: user.grade,
            shift: user.shift,
            age: user.age,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return res.json({
            success: true,
            user: userData,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при входе'
        });
    }
});

// GET /api/auth/me - Получение данных текущего пользователя
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Требуется аутентификация'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        return res.json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
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
        return res.json({
            success: true,
            message: 'Выход выполнен успешно'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Ошибка при выходе'
        });
    }
});

export default router; 