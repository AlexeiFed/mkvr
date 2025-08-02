// @ts-nocheck
/**
 * @file: workshops.ts
 * @description: Роутер для работы с мастер-классами
 * @dependencies: express, @prisma/client
 * @created: 2025-01-11
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { io } from '../index';
import { PushNotificationService } from '../services/pushNotification';

const router = Router();
const prisma = new PrismaClient();

// GET /api/workshops/child - Получить мастер-классы для ребенка
router.get('/child', authenticateToken, requireRole(['CHILD']), async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        // Получаем данные ребенка
        const child = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                school: true,
                grade: true,
                shift: true
            }
        });

        console.log('[child workshops] user:', child);

        if (!child || !child.school) {
            return res.status(400).json({
                success: false,
                error: 'Данные школы не заполнены'
            });
        }

        const now = new Date();

        // Ищем мастер-классы для школы и класса ребенка (по schoolId и classId)
        const workshops = await prisma.workshop.findMany({
            where: {
                schoolId: Number(child.school),
                classId: Number(child.grade),
                date: {
                    gte: now // только будущие мастер-классы
                },
                status: 'scheduled'
            },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        teacher: true,
                    }
                },
                executor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        console.log('[child workshops] found workshops:', workshops.map(w => ({ id: w.id, school: w.school?.name, class: w.class?.name, date: w.date, status: w.status })));

        // Подсчитываем статистику для каждого мастер-класса
        const workshopsWithStats = await Promise.all(
            workshops.map(async (workshop) => {
                const orders = await prisma.order.findMany({
                    where: { workshopId: workshop.id },
                    include: {
                        child: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                age: true,
                            }
                        },
                        parent: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                            }
                        },
                        orderComplectations: {
                            include: {
                                subService: true
                            }
                        }
                    }
                });

                const totalParticipants = orders.length;
                const paidParticipants = orders.filter(order => order.paymentStatus === 'paid').length;
                const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
                const paidAmount = orders
                    .filter(order => order.paymentStatus === 'paid')
                    .reduce((sum, order) => sum + order.amount, 0);

                // Проверяем, записан ли ребенок на этот мастер-класс
                const isChildRegistered = orders.some(order => order.childId === child.id);

                return {
                    ...workshop,
                    totalParticipants,
                    paidParticipants,
                    totalAmount,
                    paidAmount,
                    orders,
                    isChildRegistered
                };
            })
        );

        // Добавляем заголовки для предотвращения кэширования
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        return res.json({ success: true, workshops: workshopsWithStats });
    } catch (error) {
        console.error('Ошибка получения мастер-классов для ребенка:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при получении мастер-классов'
        });
    }
});

// GET /api/workshops - Получить все мастер-классы с фильтрацией
router.get('/', authenticateToken, requireRole(['ADMIN', 'EXECUTOR']), async (req: Request, res: Response) => {
    try {
        const { date, city, schoolId, classId, serviceId, status } = req.query;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
        }

        const where: any = {};

        // Фильтр по дате
        if (date) {
            const dateObj = new Date(date as string);
            where.date = {
                gte: dateObj,
                lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000) // следующий день
            };
        }

        // Фильтр по городу
        if (city) {
            where.school = {
                address: {
                    startsWith: city as string
                }
            };
        }

        // Фильтр по школе
        if (schoolId) {
            where.schoolId = parseInt(schoolId as string);
        }

        // Фильтр по классу
        if (classId) {
            where.classId = parseInt(classId as string);
        }

        // Фильтр по услуге
        if (serviceId) {
            where.serviceId = parseInt(serviceId as string);
        }

        // Фильтр по статусу
        if (status) {
            where.status = status;
        }

        const workshops = await prisma.workshop.findMany({
            where,
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                executor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                executors: {
                    include: {
                        executor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        // Подсчитываем статистику для каждого мастер-класса
        const workshopsWithStats = await Promise.all(
            workshops.map(async (workshop) => {
                const orders = await prisma.order.findMany({
                    where: { workshopId: workshop.id },
                    include: {
                        child: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                age: true,
                            }
                        },
                        parent: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                            }
                        }
                    }
                });

                const totalParticipants = orders.length;
                const paidParticipants = orders.filter(order => order.paymentStatus === 'paid').length;
                const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
                const paidAmount = orders
                    .filter(order => order.paymentStatus === 'paid')
                    .reduce((sum, order) => sum + order.amount, 0);

                return {
                    ...workshop,
                    totalParticipants,
                    paidParticipants,
                    totalAmount,
                    paidAmount,
                    orders
                };
            })
        );

        return res.json({ success: true, workshops: workshopsWithStats });
    } catch (error) {
        console.error('Ошибка получения мастер-классов:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при получении мастер-классов'
        });
    }
});

// GET /api/workshops/:id - Получить мастер-класс по ID
router.get('/:id', authenticateToken, requireRole(['ADMIN', 'EXECUTOR']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
        }
        const workshopId = parseInt(id);
        if (isNaN(workshopId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
        }

        const workshop = await prisma.workshop.findUnique({
            where: { id: workshopId },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                        subServices: true
                    }
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        teacher: true,
                        phone: true,
                    }
                },
                executor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                executors: {
                    include: {
                        executor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                }
            }
        });

        // Дополнительно получаем варианты для всех комплектаций
        if (workshop?.service?.subServices) {
            for (const subService of workshop.service.subServices) {
                const variants = await (prisma as any).subServiceVariant.findMany({
                    where: { subServiceId: subService.id },
                    orderBy: { order: 'asc' }
                });
                (subService as any).variants = variants;
            }
        }

        if (!workshop) {
            return res.status(404).json({
                success: false,
                error: 'Мастер-класс не найден'
            });
        }

        const orders = await prisma.order.findMany({
            where: { workshopId: workshop.id },
            include: {
                child: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        age: true,
                    }
                },
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    }
                },
                orderComplectations: {
                    include: {
                        subService: true,
                        variant: true
                    }
                }
            }
        });

        const totalParticipants = orders.length;
        const paidParticipants = orders.filter(order => order.paymentStatus === 'paid').length;
        const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
        const paidAmount = orders
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + order.amount, 0);

        // Отладочная информация
        console.log('Workshop orders data:', JSON.stringify(orders.map(order => ({
            id: order.id,
            childName: `${order.child.firstName} ${order.child.lastName}`,
            orderComplectations: order.orderComplectations?.map((comp: any) => ({
                subServiceId: comp.subServiceId,
                variantId: comp.variantId,
                price: comp.price
            }))
        })), null, 2));

        const workshopWithStats = {
            ...workshop,
            totalParticipants,
            paidParticipants,
            totalAmount,
            paidAmount,
            orders
        };

        return res.json({ success: true, workshop: workshopWithStats });
    } catch (error) {
        console.error('Ошибка получения мастер-класса:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при получении мастер-класса'
        });
    }
});

// PUT /api/workshops/:id - Обновить мастер-класс
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'EXECUTOR']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { executor, phone, notes } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID мастер-класса обязателен'
            });
        }

        const workshopId = parseInt(id);
        if (isNaN(workshopId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
        }

        // Проверяем существование мастер-класса
        const existingWorkshop = await prisma.workshop.findUnique({
            where: { id: workshopId }
        });

        if (!existingWorkshop) {
            return res.status(404).json({
                success: false,
                error: 'Мастер-класс не найден'
            });
        }

        // Обновляем мастер-класс
        const updatedWorkshop = await prisma.workshop.update({
            where: { id: workshopId },
            data: {
                // executor и phone сохраняем в notes как JSON
                notes: JSON.stringify({
                    executor: executor || null,
                    phone: phone || null,
                    notes: notes || null
                })
            },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                executor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        return res.json({
            success: true,
            workshop: updatedWorkshop
        });
    } catch (error) {
        console.error('Ошибка обновления мастер-класса:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении мастер-класса'
        });
    }
});

// POST /api/workshops - Создать новый мастер-класс
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const {
            serviceId,
            schoolId,
            classId,
            date,
            time,
            maxParticipants,
            executorId,
            notes
        } = req.body;

        // Валидация обязательных полей
        if (!serviceId || !schoolId || !date || !time) {
            return res.status(400).json({
                success: false,
                error: 'Все обязательные поля должны быть заполнены'
            });
        }

        // Проверка существования услуги
        const service = await prisma.service.findUnique({
            where: { id: parseInt(serviceId) }
        });

        if (!service) {
            return res.status(400).json({
                success: false,
                error: 'Услуга не найдена'
            });
        }

        // Проверка существования школы
        const school = await prisma.school.findUnique({
            where: { id: parseInt(schoolId) }
        });

        if (!school) {
            return res.status(400).json({
                success: false,
                error: 'Школа не найдена'
            });
        }

        // Проверка существования класса (если указан)
        if (classId) {
            const classExists = await prisma.class.findUnique({
                where: { id: parseInt(classId) }
            });

            if (!classExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Класс не найден'
                });
            }
        }

        // Проверка существования исполнителя (если указан)
        if (executorId) {
            const executor = await prisma.user.findUnique({
                where: { id: parseInt(executorId) }
            });

            if (!executor || executor.role !== 'EXECUTOR') {
                return res.status(400).json({
                    success: false,
                    error: 'Исполнитель не найден или не имеет соответствующей роли'
                });
            }
        }

        const workshop = await prisma.workshop.create({
            data: {
                serviceId: parseInt(serviceId),
                schoolId: parseInt(schoolId),
                classId: classId ? parseInt(classId) : null,
                date: new Date(date),
                time,
                maxParticipants: maxParticipants ? parseInt(maxParticipants) : 20, // значение по умолчанию
                executorId: executorId ? parseInt(executorId) : null,
                notes: notes || null,
            },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        teacher: true,
                    }
                },
                executor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        // Отправляем событие через WebSocket
        if (io) {
            io.emit('workshop:created', { workshop });
        }

        return res.status(201).json({ success: true, workshop });
    } catch (error) {
        console.error('Ошибка создания мастер-класса:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при создании мастер-класса'
        });
    }
});

// PUT /api/workshops/:id - Обновить мастер-класс
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
        }
        const workshopId = parseInt(id);
        if (isNaN(workshopId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
        }

        const {
            serviceId,
            schoolId,
            classId,
            date,
            time,
            maxParticipants,
            executorId,
            notes,
            status
        } = req.body;

        const updateData: any = {};

        if (serviceId !== undefined) updateData.serviceId = parseInt(serviceId);
        if (schoolId !== undefined) updateData.schoolId = parseInt(schoolId);
        if (classId !== undefined) updateData.classId = classId ? parseInt(classId) : null;
        if (date !== undefined) updateData.date = new Date(date);
        if (time !== undefined) updateData.time = time;
        if (maxParticipants !== undefined) updateData.maxParticipants = parseInt(maxParticipants);
        if (executorId !== undefined) updateData.executorId = executorId ? parseInt(executorId) : null;
        if (notes !== undefined) updateData.notes = notes;
        if (status !== undefined) updateData.status = status;

        const workshop = await prisma.workshop.update({
            where: { id: workshopId },
            data: updateData,
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        teacher: true,
                    }
                },
                executor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        // Отправляем WebSocket событие об обновлении мастер-класса
        if (io) {
            io.emit('workshop:updated', { workshopId: workshop.id });
        }

        return res.json({ success: true, workshop });
    } catch (error) {
        console.error('Ошибка обновления мастер-класса:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении мастер-класса'
        });
    }
});

// DELETE /api/workshops/:id - Удалить мастер-класс
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
        }
        const workshopId = parseInt(id);
        if (isNaN(workshopId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
        }

        // Проверяем, есть ли связанные заказы
        const ordersCount = await prisma.order.count({
            where: { workshopId }
        });

        if (ordersCount > 0) {
            return res.status(400).json({
                success: false,
                error: 'Нельзя удалить мастер-класс, к которому привязаны заказы'
            });
        }

        await prisma.workshop.delete({
            where: { id: workshopId }
        });

        return res.json({ success: true, message: 'Мастер-класс удален' });
    } catch (error) {
        console.error('Ошибка удаления мастер-класса:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при удалении мастер-класса'
        });
    }
});

// PATCH /api/workshops/:id/update-payment - Обновить статус оплаты заказа
router.patch('/:id/update-payment', authenticateToken, requireRole(['ADMIN', 'EXECUTOR']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
        }
        const { orderId, paymentStatus, paidAmount } = req.body;
        const workshopId = parseInt(id);
        const orderIdNum = parseInt(orderId);
        if (isNaN(workshopId) || isNaN(orderIdNum)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректные ID'
            });
        }

        // Проверяем, что заказ принадлежит этому мастер-классу
        const order = await prisma.order.findFirst({
            where: {
                id: orderIdNum,
                workshopId: workshopId
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Заказ не найден в данном мастер-классе'
            });
        }

        // Обновляем статус оплаты
        const updateData: any = {};
        if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
        if (paidAmount !== undefined) updateData.amount = parseFloat(paidAmount);

        const updatedOrder = await prisma.order.update({
            where: { id: orderIdNum },
            data: updateData,
            include: {
                child: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        age: true,
                    }
                },
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    }
                },
                orderComplectations: {
                    include: {
                        subService: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        return res.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Ошибка обновления оплаты:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении оплаты'
        });
    }
});

// GET /api/workshops/statistics - Получить статистику мастер-классов
router.get('/statistics', authenticateToken, requireRole(['ADMIN', 'EXECUTOR']), async (req: Request, res: Response) => {
    console.log('=== НАЧАЛО ОБРАБОТКИ СТАТИСТИКИ ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('User:', (req as any).user);

    try {
        const userId = (req as any).user?.id;
        console.log('Получен запрос статистики от пользователя:', userId);

        // Общее количество мастер-классов
        const total = await prisma.workshop.count();
        console.log('Общее количество мастер-классов:', total);

        // Завершенные мастер-классы (прошедшие даты)
        const completed = await prisma.workshop.count({
            where: {
                date: {
                    lt: new Date()
                }
            }
        });
        console.log('Завершенные мастер-классы:', completed);

        // Запланированные мастер-классы (будущие даты)
        const upcoming = await prisma.workshop.count({
            where: {
                date: {
                    gte: new Date()
                }
            }
        });
        console.log('Запланированные мастер-классы:', upcoming);

        // Общая выручка
        const orders = await prisma.order.findMany({
            where: {
                paymentStatus: 'PAID'
            },
            select: {
                amount: true
            }
        });
        console.log('Найдено оплаченных заказов:', orders.length);

        const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
        console.log('Общая выручка:', totalRevenue);

        const statistics = {
            total,
            completed,
            upcoming,
            totalRevenue
        };

        console.log('Статистика успешно сформирована:', statistics);
        return res.json({ success: true, statistics });
    } catch (error) {
        console.error('Ошибка статистики мастер-классов:', error);
        console.error('Стек ошибки:', error instanceof Error ? error.stack : 'Неизвестная ошибка');

        // Проверяем тип ошибки
        if (error instanceof Error) {
            console.error('Тип ошибки: Error');
            console.error('Сообщение ошибки:', error.message);
            console.error('Имя ошибки:', error.name);
        } else {
            console.error('Тип ошибки:', typeof error);
            console.error('Значение ошибки:', error);
        }

        return res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
});

// Назначить исполнителей к мастер-классу
router.post('/:id/executors', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { executorIds } = req.body;

        if (!executorIds || !Array.isArray(executorIds)) {
            return res.status(400).json({ error: 'executorIds должен быть массивом' });
        }

        if (!id) {
            return res.status(400).json({ error: 'ID мастер-класса не указан' });
        }

        const workshop = await prisma.workshop.findUnique({
            where: { id: parseInt(id) }
        });

        if (!workshop) {
            return res.status(404).json({ error: 'Мастер-класс не найден' });
        }

        // Удаляем существующих исполнителей
        await prisma.workshopExecutor.deleteMany({
            where: { workshopId: parseInt(id) }
        });

        // Добавляем новых исполнителей
        const workshopExecutors = [];
        for (let i = 0; i < executorIds.length; i++) {
            const executorId = executorIds[i];
            const workshopExecutor = await prisma.workshopExecutor.create({
                data: {
                    workshopId: parseInt(id),
                    executorId,
                    isPrimary: i === 0 // первый исполнитель становится основным
                }
            });
            workshopExecutors.push(workshopExecutor);
        }

        // Обновляем основного исполнителя в мастер-классе
        if (executorIds.length > 0) {
            await prisma.workshop.update({
                where: { id: parseInt(id) },
                data: { executorId: executorIds[0] }
            });
        }

        // Отправляем push-уведомления исполнителям
        const workshopData = await prisma.workshop.findUnique({
            where: { id: parseInt(id) },
            include: { service: true }
        });

        for (const executorId of executorIds) {
            try {
                await PushNotificationService.sendWorkshopAssignmentNotification(
                    executorId,
                    parseInt(id),
                    workshopData?.service?.name || 'Мастер-класс',
                    workshopData?.date || new Date()
                );
            } catch (error) {
                console.error(`Ошибка отправки уведомления исполнителю ${executorId}:`, error);
            }
        }

        // Отправляем WebSocket событие для обновления данных у исполнителей
        if (io) {
            io.emit('workshop:updated', { workshopId: parseInt(id) });
        }

        return res.json({ message: 'Исполнители назначены успешно', count: workshopExecutors.length });
    } catch (error) {
        console.error('Ошибка при назначении исполнителей:', error);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить исполнителей мастер-класса
router.get('/:id/executors', authenticateToken, requireRole(['ADMIN', 'EXECUTOR']), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID мастер-класса не указан' });
        }

        const executors = await prisma.workshopExecutor.findMany({
            where: { workshopId: parseInt(id) },
            include: {
                executor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: { isPrimary: 'desc' }
        });

        return res.json(executors);
    } catch (error) {
        console.error('Ошибка при получении исполнителей:', error);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удалить исполнителя из мастер-класса
router.delete('/:id/executors/:executorId', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id, executorId } = req.params;

        if (!id || !executorId) {
            return res.status(400).json({ error: 'ID мастер-класса или исполнителя не указан' });
        }

        const workshopExecutor = await prisma.workshopExecutor.findFirst({
            where: {
                workshopId: parseInt(id),
                executorId: parseInt(executorId)
            }
        });

        if (!workshopExecutor) {
            return res.status(404).json({ error: 'Исполнитель не найден в этом мастер-классе' });
        }

        await prisma.workshopExecutor.delete({
            where: { id: workshopExecutor.id }
        });

        // Если удаляемый исполнитель был основным, назначаем нового
        if (workshopExecutor.isPrimary) {
            const nextExecutor = await prisma.workshopExecutor.findFirst({
                where: { workshopId: parseInt(id) },
                orderBy: { assignedAt: 'asc' }
            });

            if (nextExecutor) {
                await prisma.workshopExecutor.update({
                    where: { id: nextExecutor.id },
                    data: { isPrimary: true }
                });

                await prisma.workshop.update({
                    where: { id: parseInt(id) },
                    data: { executorId: nextExecutor.executorId }
                });
            } else {
                // Если исполнителей больше нет, очищаем основного исполнителя
                await prisma.workshop.update({
                    where: { id: parseInt(id) },
                    data: { executorId: null }
                });
            }
        }

        // Отправляем WebSocket событие для обновления данных у исполнителей
        if (io) {
            io.emit('workshop:updated', { workshopId: parseInt(id) });
        }

        return res.json({ message: 'Исполнитель удален из мастер-класса' });
    } catch (error) {
        console.error('Ошибка при удалении исполнителя:', error);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить мастер-классы исполнителя
router.get('/executor/my-workshops', authenticateToken, requireRole(['EXECUTOR']), async (req, res) => {
    try {
        const userId = req.user!.id;

        const workshopExecutors = await prisma.workshopExecutor.findMany({
            where: { executorId: userId },
            include: {
                workshop: {
                    include: {
                        service: true,
                        school: true,
                        class: true,
                        orders: {
                            include: {
                                child: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        age: true
                                    }
                                },
                                parent: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        phone: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { workshop: { date: 'asc' } }
        });

        // Подсчитываем статистику для каждого мастер-класса
        const workshopsWithStats = workshopExecutors.map(workshopExecutor => {
            const workshop = workshopExecutor.workshop;
            const orders = workshop.orders || [];

            const totalParticipants = orders.length;
            const paidParticipants = orders.filter(order => order.paymentStatus === 'paid').length;
            const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
            const paidAmount = orders
                .filter(order => order.paymentStatus === 'paid')
                .reduce((sum, order) => sum + order.amount, 0);

            return {
                ...workshopExecutor,
                workshop: {
                    ...workshop,
                    totalParticipants,
                    paidParticipants,
                    totalAmount,
                    paidAmount,
                    orders
                }
            };
        });

        res.json(workshopsWithStats);
    } catch (error) {
        console.error('Ошибка при получении мастер-классов исполнителя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

export default router; 