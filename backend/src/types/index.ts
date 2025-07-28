/**
 * @file: types/index.ts
 * @description: Базовые типы для Backend API
 * @dependencies: Нет
 * @created: 2024-07-06
 */

// Роли пользователей
export type UserRole = 'admin' | 'executor' | 'parent' | 'child';

// Типы ручек
export type PenType = 'regular' | 'double' | 'light';

// Типы лака
export type VarnishType = 'regular' | 'sparkle';

// Статусы заказа
export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled';

// Статусы платежа
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

// Статусы мастер-класса
export type WorkshopStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

// Интерфейс пользователя
export interface User {
    id: number;
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    school?: string;
    grade?: string;
    shift?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Интерфейс заказа
export interface Order {
    id: number;
    childId: number;
    parentId: number;
    school: string;
    grade: string;
    shift: string;
    penType: PenType;
    varnish: VarnishType;
    stickers: string[];
    personalInscription?: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    amount: number;
    workshopDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Интерфейс мастер-класса
export interface Workshop {
    id: number;
    school: string;
    date: Date;
    shift: string;
    maxParticipants: number;
    currentParticipants: number;
    status: WorkshopStatus;
    executorId?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Интерфейс чата
export interface Chat {
    id: number;
    parentId: number;
    adminId: number;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

// Интерфейс сообщения
export interface Message {
    id: number;
    senderId: number;
    content: string;
    timestamp: Date;
    isRead: boolean;
}

// Интерфейс API ответа
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Интерфейс JWT payload
export interface JWTPayload {
    userId: number;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

// Интерфейс для аутентификации
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    city?: string;
    school?: string;
    grade?: string;
    shift?: string;
} 