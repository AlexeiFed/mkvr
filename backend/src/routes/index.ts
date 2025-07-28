/**
 * @file: index.ts
 * @description: Главный файл роутеров для объединения всех API endpoints
 * @dependencies: express, users, products, services, schools, classes, shifts
 * @created: 2024-07-06
 */

import { Router } from 'express';
import authRouter from './auth';
import usersRouter from './users';
import productsRouter from './products';
import servicesRouter from './services';
import schoolsRouter from './schools';
import classesRouter from './classes';
import shiftsRouter from './shifts';
import subServicesRouter from './subServices';
import uploadRouter from './upload';
import workshopsRouter from './workshops';
import chatRouter from './chat';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/orders', productsRouter);
router.use('/services', servicesRouter);
router.use('/schools', schoolsRouter);
router.use('/classes', classesRouter);
router.use('/shifts', shiftsRouter);
router.use('/subServices', subServicesRouter);
router.use('/upload', uploadRouter);
router.use('/workshops', workshopsRouter);
router.use('/chat', chatRouter);

export default router; 