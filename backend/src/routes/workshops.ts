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
            res.status(401).json({
                success: false,
                error: 'Пользователь не найден'
            });
            return;
        }

        // Получаем данные ребенка через последний заказ
        const latestOrder = await prisma.order.findFirst({
            where: { childId: userId },
            include: {
                workshop: {
                    include: {
                        school: true,
                        class: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log('[child workshops] latest order:', latestOrder);

        if (!latestOrder?.workshop?.school) {
            res.status(400).json({
                success: false,
                error: 'Данные школы не заполнены'
            });
            return;
        }

        const now = new Date();

        // Ищем мастер-классы для школы и класса ребенка
        const workshops = await prisma.workshop.findMany({
            where: {
                schoolId: latestOrder.workshop.schoolId,
                classId: latestOrder.workshop.classId,
                date: {
                    gte: now // только будущие мастер-классы
                },
                isActive: true
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
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        console.log('[child workshops] found workshops:', workshops.map(w => ({ id: w.id, school: w.school?.name, class: w.class?.name, date: w.date })));

        // Подсчитываем статистику для каждого мастер-класса
        const workshopsWithStats = await Promise.all(
            workshops.map(async (workshop) => {
                const orders = await prisma.order.findMany({
                    where: { workshopId: workshop.id },
                    include: {
                        child: {
                            select: {
                                firstName: true,
                                lastName: true,
                                age: true
                            }
                        }
                    }
                });

                return {
                    ...workshop,
                    totalOrders: orders.length,
                    totalAmount: orders.reduce((sum, order) => sum + order.amount, 0),
                    children: orders.map(order => order.child)
                };
            })
        );

        res.json({
            success: true,
            workshops: workshopsWithStats
        });
    } catch (error) {
        console.error('Ошибка получения мастер-классов для ребенка:', error);
        res.status(500).json({
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
            res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
            return;
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
                const paidParticipants = orders.filter(order => order.paymentStatus === 'PAID').length;
                const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
                const paidAmount = orders
                    .filter(order => order.paymentStatus === 'PAID')
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

        res.json({ success: true, workshops: workshopsWithStats });
    } catch (error) {
        console.error('Ошибка получения мастер-классов:', error);
        res.status(500).json({
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
            res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
            return;
        }
        const workshopId = parseInt(id);
        if (isNaN(workshopId)) {
            res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
            return;
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
                }
            }
        });

        // Дополнительно получаем варианты для всех комплектаций
        if (workshop?.service?.subServices) {
            for (const subService of workshop.service.subServices) {
                const variants = await prisma.subServiceVariant.findMany({
                    where: { subServiceId: subService.id },
                    orderBy: { id: 'asc' }
                });
                (subService as any).variants = variants;
            }
        }

        if (!workshop) {
            res.status(404).json({
                success: false,
                error: 'Мастер-класс не найден'
            });
            return;
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
        const paidParticipants = orders.filter(order => order.paymentStatus === 'PAID').length;
        const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
        const paidAmount = orders
            .filter(order => order.paymentStatus === 'PAID')
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

        res.json({ success: true, workshop: workshopWithStats });
    } catch (error) {
        console.error('Ошибка получения мастер-класса:', error);
        res.status(500).json({
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
            res.status(400).json({
                success: false,
                error: 'ID мастер-класса обязателен'
            });
            return;
        }

        const workshopId = parseInt(id);
        if (isNaN(workshopId)) {
            res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
            return;
        }

        // Проверяем существование мастер-класса
        const existingWorkshop = await prisma.workshop.findUnique({
            where: { id: workshopId }
        });

        if (!existingWorkshop) {
            res.status(404).json({
                success: false,
                error: 'Мастер-класс не найден'
            });
            return;
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
                }
            }
        });

        res.json({
            success: true,
            workshop: updatedWorkshop
        });
    } catch (error) {
        console.error('Ошибка обновления мастер-класса:', error);
        res.status(500).json({
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
            executorId,
            notes
        } = req.body;

        // Валидация обязательных полей
        if (!serviceId || !schoolId || !date || !time) {
            res.status(400).json({
                success: false,
                error: 'Все обязательные поля должны быть заполнены'
            });
            return;
        }

        // Проверка существования услуги
        const service = await prisma.service.findUnique({
            where: { id: parseInt(serviceId) }
        });

        if (!service) {
            res.status(400).json({
                success: false,
                error: 'Услуга не найдена'
            });
            return;
        }

        // Проверка существования школы
        const school = await prisma.school.findUnique({
            where: { id: parseInt(schoolId) }
        });

        if (!school) {
            res.status(400).json({
                success: false,
                error: 'Школа не найдена'
            });
            return;
        }

        // Проверка существования класса (если указан)
        if (classId) {
            const classExists = await prisma.class.findUnique({
                where: { id: parseInt(classId) }
            });

            if (!classExists) {
                res.status(400).json({
                    success: false,
                    error: 'Класс не найден'
                });
                return;
            }
        }

        // Проверка существования исполнителя (если указан)
        if (executorId) {
            const executor = await prisma.user.findUnique({
                where: { id: parseInt(executorId) }
            });

            if (!executor || executor.role !== 'EXECUTOR') {
                res.status(400).json({
                    success: false,
                    error: 'Исполнитель не найден или не имеет соответствующей роли'
                });
                return;
            }
        }

        const workshop = await prisma.workshop.create({
            data: {
                serviceId: parseInt(serviceId),
                schoolId: parseInt(schoolId),
                classId: classId ? parseInt(classId) : null,
                date: new Date(date),
                time,
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
                }
            }
        });

        // Отправляем событие через WebSocket
        if (io) {
            io.emit('workshop:created', { workshop });
        }

        res.status(201).json({ success: true, workshop });
    } catch (error) {
        console.error('Ошибка создания мастер-класса:', error);
        res.status(500).json({
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
            res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
            return;
        }
        const workshopId = parseInt(id);
        if (isNaN(workshopId)) {
            res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
            return;
        }

        const {
            serviceId,
            schoolId,
            classId,
            date,
            time,
            notes,
            status
        } = req.body;

        const updateData: any = {};

        if (serviceId !== undefined) updateData.serviceId = parseInt(serviceId);
        if (schoolId !== undefined) updateData.schoolId = parseInt(schoolId);
        if (classId !== undefined) updateData.classId = classId ? parseInt(classId) : null;
        if (date !== undefined) updateData.date = new Date(date);
        if (time !== undefined) updateData.time = time;
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
                }
            }
        });

        // Отправляем WebSocket событие об обновлении мастер-класса
        if (io) {
            io.emit('workshop:updated', { workshopId: workshop.id });
        }

        res.json({ success: true, workshop });
    } catch (error) {
        console.error('Ошибка обновления мастер-класса:', error);
        res.status(500).json({
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
            res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
            return;
        }
        const workshopId = parseInt(id);
        if (isNaN(workshopId)) {
            res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
            return;
        }

        // Проверяем, есть ли связанные заказы
        const ordersCount = await prisma.order.count({
            where: { workshopId }
        });

        if (ordersCount > 0) {
            res.status(400).json({
                success: false,
                error: 'Нельзя удалить мастер-класс, к которому привязаны заказы'
            });
            return;
        }

        await prisma.workshop.delete({
            where: { id: workshopId }
        });

        res.json({ success: true, message: 'Мастер-класс удален' });
    } catch (error) {
        console.error('Ошибка удаления мастер-класса:', error);
        res.status(500).json({
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
            res.status(400).json({
                success: false,
                error: 'Некорректный ID мастер-класса'
            });
            return;
        }
        const { orderId, paymentStatus, paidAmount } = req.body;
        const workshopId = parseInt(id);
        const orderIdNum = parseInt(orderId);
        if (isNaN(workshopId) || isNaN(orderIdNum)) {
            res.status(400).json({
                success: false,
                error: 'Некорректные ID'
            });
            return;
        }

        // Проверяем, что заказ принадлежит этому мастер-классу
        const order = await prisma.order.findFirst({
            where: {
                id: orderIdNum,
                workshopId: workshopId
            }
        });

        if (!order) {
            res.status(404).json({
                success: false,
                error: 'Заказ не найден в данном мастер-классе'
            });
            return;
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

        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Ошибка обновления оплаты:', error);
        res.status(500).json({
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
        res.json({ success: true, statistics });
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

        res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
});

// Назначить исполнителей к мастер-классу
router.post('/:id/executors', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { executorIds } = req.body;

        if (!executorIds || !Array.isArray(executorIds)) {
            res.status(400).json({ error: 'executorIds должен быть массивом' });
            return;
        }

        if (!id) {
            res.status(400).json({ error: 'ID мастер-класса не указан' });
            return;
        }

        const workshop = await prisma.workshop.findUnique({
            where: { id: parseInt(id) }
        });

        if (!workshop) {
            res.status(404).json({ error: 'Мастер-класс не найден' });
            return;
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
                    executorId
                }
            });
            workshopExecutors.push(workshopExecutor);
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

        res.json({ message: 'Исполнители назначены успешно', count: workshopExecutors.length });
    } catch (error) {
        console.error('Ошибка при назначении исполнителей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить исполнителей мастер-класса
router.get('/:id/executors', authenticateToken, requireRole(['ADMIN', 'EXECUTOR']), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'ID мастер-класса не указан' });
            return;
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
            orderBy: { createdAt: 'desc' }
        });

        res.json(executors);
    } catch (error) {
        console.error('Ошибка при получении исполнителей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удалить исполнителя из мастер-класса
router.delete('/:id/executors/:executorId', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id, executorId } = req.params;

        if (!id || !executorId) {
            res.status(400).json({ error: 'ID мастер-класса или исполнителя не указан' });
            return;
        }

        const workshopExecutor = await prisma.workshopExecutor.findFirst({
            where: {
                workshopId: parseInt(id),
                executorId: parseInt(executorId)
            }
        });

        if (!workshopExecutor) {
            res.status(404).json({ error: 'Исполнитель не найден в этом мастер-классе' });
            return;
        }

        await prisma.workshopExecutor.delete({
            where: { id: workshopExecutor.id }
        });

        // Отправляем WebSocket событие для обновления данных у исполнителей
        if (io) {
            io.emit('workshop:updated', { workshopId: parseInt(id) });
        }

        res.json({ message: 'Исполнитель удален из мастер-класса' });
    } catch (error) {
        console.error('Ошибка при удалении исполнителя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
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
            const paidParticipants = orders.filter(order => order.paymentStatus === 'PAID').length;
            const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
            const paidAmount = orders
                .filter(order => order.paymentStatus === 'PAID')
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