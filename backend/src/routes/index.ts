// @ts-nocheck
/**
 * @file: index.ts
 * @description: Основной файл роутов API
 * @dependencies: express, все роуты
 * @created: 2024-07-06
 */

import express from 'express';
import authRoutes from './auth';
import usersRoutes from './users';
import schoolsRoutes from './schools';
import classesRoutes from './classes';
import servicesRoutes from './services';
import subServicesRoutes from './subServices';
import shiftsRoutes from './shifts';
import workshopsRoutes from './workshops';
import chatRoutes from './chat';
import productsRoutes from './products';
import uploadRoutes from './upload';
import pushNotificationsRoutes from './pushNotifications';

const router = express.Router();

// Подключаем все роуты
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/schools', schoolsRoutes);
router.use('/classes', classesRoutes);
router.use('/services', servicesRoutes);
router.use('/sub-services', subServicesRoutes);
router.use('/shifts', shiftsRoutes);
router.use('/workshops', workshopsRoutes);
router.use('/chat', chatRoutes);
router.use('/products', productsRoutes);
router.use('/upload', uploadRoutes);
router.use('/push-notifications', pushNotificationsRoutes);

export default router; 