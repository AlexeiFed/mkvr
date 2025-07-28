/**
 * @file: products.ts
 * @description: Роутер для работы с заказами (продуктами)
 * @dependencies: express, @prisma/client
 * @created: 2024-07-06
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { io } from '../index';

const router = Router();
const prisma = new PrismaClient();

// GET /api/products - Получить все заказы
router.get('/', async (_req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                child: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        age: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                orderComplectations: {
                    include: {
                        subService: true,
                        variant: true
                    } as any
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении заказов'
        });
    }
});

// GET /api/products/:id - Получить заказ по ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID заказа обязателен'
            });
        }

        const orderId = parseInt(id);
        if (isNaN(orderId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID заказа'
            });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                child: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Заказ не найден'
            });
        }

        return res.json({ success: true, order });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Ошибка при получении заказа'
        });
    }
});

// POST /api/products - Создать новый заказ
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            childId,
            parentId,
            workshopId,
            notes,
            selectedComplectations,
        } = req.body;

        // Базовая валидация
        if (!childId || !parentId || !workshopId) {
            return res.status(400).json({
                success: false,
                error: 'Все обязательные поля должны быть заполнены'
            });
        }

        // Получаем данные ребёнка для проверки возраста
        const child = await prisma.user.findUnique({
            where: { id: parseInt(childId) },
            select: { id: true, age: true, role: true }
        });

        if (!child) {
            return res.status(400).json({
                success: false,
                error: 'Ребёнок не найден'
            });
        }

        if (child.role !== 'child') {
            return res.status(400).json({
                success: false,
                error: 'Указанный пользователь не является ребёнком'
            });
        }

        // Проверяем комплектующие по возрасту
        if (selectedComplectations && selectedComplectations.length > 0) {
            // selectedComplectations может быть массивом ID или массивом объектов
            const complectationIds = selectedComplectations.map((comp: any) => {
                // Если это объект с subServiceId
                if (typeof comp === 'object' && comp.subServiceId !== undefined) {
                    return comp.subServiceId;
                }
                // Если это просто ID
                return comp;
            }).filter((id: any) => id !== undefined && id !== null); // Фильтруем undefined и null

            if (complectationIds.length > 0) {
                const complectations = await prisma.subService.findMany({
                    where: {
                        id: { in: complectationIds }
                    },
                    select: { id: true, name: true, minAge: true }
                });

                const invalidComplectations = complectations.filter(comp => comp.minAge > child.age);
                if (invalidComplectations.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: `Комплектующие "${invalidComplectations.map(c => c.name).join(', ')}" недоступны для возраста ${child.age} лет`
                    });
                }
            }
        }

        // Создаём заказ
        const order = await prisma.order.create({
            data: {
                childId: parseInt(childId),
                parentId: parseInt(parentId),
                workshopId: parseInt(workshopId),
                notes: notes || '',
                amount: 0, // Будет рассчитана ниже
                workshopDate: new Date(), // Будет получена из мастер-класса
                status: 'pending',
                paymentStatus: 'pending'
            } as any,
            include: {
                child: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        age: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        // Добавляем комплектующие к заказу
        let totalAmount = 0;
        if (selectedComplectations && selectedComplectations.length > 0) {
            // Получаем данные о выбранных комплектациях из базы данных
            const complectationIds = selectedComplectations.map((comp: any) => {
                if (typeof comp === 'object' && comp.subServiceId !== undefined) {
                    return comp.subServiceId;
                }
                return comp;
            }).filter((id: any) => id !== undefined && id !== null);

            const complectationsData = await prisma.subService.findMany({
                where: { id: { in: complectationIds } },
                select: { id: true, price: true }
            });

            const orderComplectations = await Promise.all(selectedComplectations.map(async (comp: any) => {
                const compId = typeof comp === 'object' && comp.subServiceId !== undefined ? comp.subServiceId : comp;
                const variantId = typeof comp === 'object' && comp.variantId !== undefined ? comp.variantId : null;
                const complectation = complectationsData.find(c => c.id === compId);

                let price = 0;
                if (variantId) {
                    // Если есть вариант, получаем его цену из базы
                    const variant = await (prisma as any).subServiceVariant.findUnique({
                        where: { id: parseInt(variantId) },
                        select: { price: true }
                    });
                    price = variant?.price || 0;
                } else {
                    // Если нет варианта, берем цену комплектации
                    price = complectation?.price || 0;
                }

                const compData: any = {
                    orderId: order.id,
                    subServiceId: parseInt(compId),
                    quantity: 1,
                    price: price
                };

                // Добавляем variantId если он есть
                if (variantId) {
                    compData.variantId = parseInt(variantId);
                }

                totalAmount += price;

                return compData;
            }));

            // Отладочная информация
            console.log('Creating orderComplectations:', JSON.stringify(orderComplectations, null, 2));

            await prisma.orderComplectation.createMany({
                data: orderComplectations
            });

            // Обновляем общую сумму заказа
            await prisma.order.update({
                where: { id: order.id },
                data: { amount: totalAmount }
            });
        }

        // После создания заказа обновляем количество участников и отправляем событие WebSocket
        if (workshopId) {
            // Обновить количество участников (currentParticipants)
            const total = await prisma.order.count({ where: { workshopId: parseInt(workshopId) } });
            await prisma.workshop.update({
                where: { id: parseInt(workshopId) },
                data: { currentParticipants: total }
            });
            // Отправить событие WebSocket
            if (req.app.get('io')) {
                req.app.get('io').emit('workshop:updated', { workshopId: parseInt(workshopId) });
            }
        }

        return res.status(201).json({ success: true, order });
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка при создании заказа'
        });
    }
});

// PUT /api/products/:id - Обновить заказ
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID заказа обязателен'
            });
        }

        const orderId = parseInt(id);
        if (isNaN(orderId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID заказа'
            });
        }

        const {
            notes,
            status,
            paymentStatus,
            selectedComplectations
        } = req.body;

        // Получаем заказ и мастер-класс
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            select: { workshopId: true, workshopDate: true }
        });
        if (!existingOrder) {
            return res.status(404).json({ success: false, error: 'Заказ не найден' });
        }
        // Проверка 24 часов
        const now = new Date();
        const wsDate = new Date(existingOrder.workshopDate);
        const diffMs = wsDate.getTime() - now.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);
        if (diffHrs < 24) {
            return res.status(400).json({ success: false, error: 'Изменять комплектацию можно только за 24 часа до начала мастер-класса' });
        }

        // Обновляем заказ
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                ...(notes && { notes }),
                ...(status && { status }),
                ...(paymentStatus && { paymentStatus }),
            },
            include: {
                child: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        // Обновляем комплектации заказа
        if (selectedComplectations && Array.isArray(selectedComplectations)) {
            // Удаляем старые
            await prisma.orderComplectation.deleteMany({ where: { orderId } });

            // Добавляем новые
            let totalAmount = 0;
            const orderComplectations = await Promise.all(selectedComplectations.map(async (comp: any) => {
                const compData: any = {
                    orderId: order.id,
                    subServiceId: parseInt(comp.subServiceId),
                    quantity: 1,
                    price: 0
                };

                // Если есть вариант, получаем его цену из базы
                if (comp.variantId) {
                    compData.variantId = parseInt(comp.variantId);
                    const variant = await (prisma as any).subServiceVariant.findUnique({
                        where: { id: parseInt(comp.variantId) },
                        select: { price: true }
                    });
                    if (variant) {
                        compData.price = variant.price;
                        totalAmount += variant.price;
                    }
                } else {
                    // Если нет варианта, получаем цену комплектации
                    const complectation = await prisma.subService.findUnique({
                        where: { id: parseInt(comp.subServiceId) },
                        select: { price: true }
                    });
                    if (complectation) {
                        compData.price = complectation.price;
                        totalAmount += complectation.price;
                    }
                }

                return compData;
            }));

            await prisma.orderComplectation.createMany({ data: orderComplectations });

            // Обновляем общую сумму заказа
            await prisma.order.update({
                where: { id: order.id },
                data: { amount: totalAmount }
            });
        }

        // После обновления отправляем событие WebSocket
        if (existingOrder.workshopId && req.app.get('io')) {
            req.app.get('io').emit('workshop:updated', { workshopId: existingOrder.workshopId });
        }

        return res.json({ success: true, order });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении заказа'
        });
    }
});

// DELETE /api/products/:id - Удалить заказ
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID заказа обязателен'
            });
        }

        const orderId = parseInt(id);
        if (isNaN(orderId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID заказа'
            });
        }

        // Получаем заказ перед удалением, чтобы узнать workshopId
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { workshopId: true }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Заказ не найден'
            });
        }

        await prisma.order.delete({
            where: { id: orderId },
        });

        // Отправляем WebSocket события
        if (order.workshopId) {
            io.emit('workshop:updated', { workshopId: order.workshopId });
            io.emit('order:cancelled', { workshopId: order.workshopId });
        }

        return res.json({ success: true, message: 'Заказ удален' });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Ошибка при удалении заказа'
        });
    }
});

export default router; 