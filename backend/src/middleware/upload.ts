/**
 * @file: upload.ts
 * @description: Middleware для загрузки файлов
 * @dependencies: multer, express
 * @created: 2024-07-07
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Создаем папки для загрузки, если их нет
const uploadDir = path.join(__dirname, '../../uploads');
const avatarDir = path.join(uploadDir, 'avatars');
const photoDir = path.join(uploadDir, 'photos');
const videoDir = path.join(uploadDir, 'videos');

[uploadDir, avatarDir, photoDir, videoDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Настройка хранилища для аватарок
const avatarStorage = multer.diskStorage({
    destination: (_req: any, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, avatarDir);
    },
    filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

// Настройка хранилища для фотографий
const photoStorage = multer.diskStorage({
    destination: (_req: any, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, photoDir);
    },
    filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});

// Настройка хранилища для видео
const videoStorage = multer.diskStorage({
    destination: (_req: any, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, videoDir);
    },
    filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'video-' + uniqueSuffix + ext);
    }
});

// Фильтр файлов для изображений
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Только изображения разрешены'));
    }
    cb(null, true);
};

// Фильтр файлов для видео
const videoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!file.mimetype.startsWith('video/')) {
        return cb(new Error('Только видео файлы разрешены'));
    }
    cb(null, true);
};

// Настройка multer для разных типов файлов
const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

const photoUpload = multer({
    storage: photoStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10 // Максимум 10 файлов
    }
});

const videoUpload = multer({
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    }
});

// Middleware для загрузки аватарки
export const uploadAvatar = avatarUpload.single('file');

// Middleware для загрузки фотографий
export const uploadPhotos = photoUpload.array('files', 10);

// Middleware для загрузки видео
export const uploadVideo = videoUpload.single('file');

// Middleware для загрузки любого файла
export const uploadAny = multer({
    storage: multer.diskStorage({
        destination: (_req: any, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
            cb(null, uploadDir);
        },
        filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, 'file-' + uniqueSuffix + ext);
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
}).single('file');

export default {
    uploadAvatar,
    uploadPhotos,
    uploadVideo,
    uploadAny
}; 