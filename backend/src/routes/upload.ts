// @ts-nocheck
/**
 * @file: upload.ts
 * @description: API роуты для загрузки файлов
 * @dependencies: express, multer, path
 * @created: 2024-07-07
 */

import express from 'express';
import { uploadAvatar, uploadPhotos, uploadVideo } from '../middleware/upload';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Загрузка аватарки
router.post('/avatar', authenticateToken, (req: any, res: any) => {
    uploadAvatar(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Файл не был загружен' });
        }

        // Возвращаем путь к файлу
        const fileUrl = `/uploads/avatars/${req.file.filename}`;
        return res.json({
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    });
});

// Загрузка фотографий
router.post('/photo', authenticateToken, (req: any, res: any) => {
    uploadPhotos(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Файлы не были загружены' });
        }

        const files = Array.isArray(req.files) ? req.files : [req.files];
        const fileUrls = files.map((file: any) => ({
            url: `/uploads/photos/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size
        }));

        return res.json({ files: fileUrls });
    });
});

// Загрузка множественных фотографий (для вариантов)
router.post('/photos', authenticateToken, (req: any, res: any) => {
    uploadPhotos(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Файлы не были загружены' });
        }

        const files = Array.isArray(req.files) ? req.files : [req.files];
        const fileUrls = files.map((file: any) => ({
            url: `/uploads/photos/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size
        }));

        return res.json({ files: fileUrls });
    });
});

// Загрузка видео
router.post('/video', authenticateToken, (req: any, res: any) => {
    uploadVideo(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Файл не был загружен' });
        }

        // Возвращаем путь к файлу
        const fileUrl = `/uploads/videos/${req.file.filename}`;
        return res.json({
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    });
});

export default router; 