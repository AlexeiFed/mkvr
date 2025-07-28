/**
 * @file: auth.ts
 * @description: JWT middleware для проверки аутентификации
 * @dependencies: jsonwebtoken, express
 * @created: 2024-07-06
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Расширяем интерфейс Request для добавления user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: string;
            };
        }
    }
}

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';

// Middleware для проверки JWT токена
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        console.error('Ошибка авторизации: токен доступа не предоставлен');
        res.status(401).json({
            success: false,
            error: 'Токен доступа не предоставлен'
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: number;
            email: string;
            role: string;
        };

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Ошибка авторизации: недействительный токен', error);
        res.status(403).json({
            success: false,
            error: 'Недействительный токен'
        });
        return;
    }
};

// Middleware для проверки роли пользователя
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        console.log('[requireRole] roles:', roles, 'req.user:', req.user);
        if (!req.user) {
            console.error('Ошибка авторизации: требуется аутентификация');
            res.status(401).json({
                success: false,
                error: 'Требуется аутентификация'
            });
            return;
        }

        // Сравнение ролей в нижнем регистре
        const userRole = req.user.role.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());
        console.log('[requireRole] userRole:', userRole, 'allowedRoles:', allowedRoles);
        if (!allowedRoles.includes(userRole)) {
            console.error('Ошибка авторизации: недостаточно прав доступа', req.user);
            res.status(403).json({
                success: false,
                error: 'Недостаточно прав доступа'
            });
            return;
        }

        next();
    };
};

// Middleware для проверки, что пользователь является владельцем ресурса или админом
export const requireOwnershipOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
        return;
    }

    const resourceId = parseInt(req.params['id'] || '0');
    const userId = req.user.id;

    // Админ может управлять любыми ресурсами
    if (req.user.role === 'admin') {
        next();
        return;
    }

    // Пользователь может управлять только своими ресурсами
    if (resourceId === userId) {
        next();
        return;
    }

    res.status(403).json({
        success: false,
        error: 'Недостаточно прав доступа'
    });
    return;
}; 