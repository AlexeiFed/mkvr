/**
 * @file: types/index.ts
 * @description: Базовые типы для Frontend приложения
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
    role: UserRole;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    school?: string;
    grade?: string;
    shift?: string;
    age?: number;
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
    serviceId: number;
    schoolId: number;
    classId?: number;
    date: Date;
    time: string;
    maxParticipants: number;
    currentParticipants: number;
    executorId?: number;
    notes?: string;
    status: WorkshopStatus;
    totalParticipants: number;
    paidParticipants: number;
    totalAmount: number;
    paidAmount: number;
    service?: {
        id: number;
        name: string;
        subServices?: SubService[];
    };
    executor?: {
        id: number;
        firstName: string;
        lastName: string;
    };
    executors?: Array<{
        id: number;
        workshopId: number;
        executorId: number;
        assignedAt: Date;
        isPrimary: boolean;
        executor: {
            id: number;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
        };
    }>;
    school?: {
        id: number;
        name: string;
    };
    class?: {
        id: number;
        name: string;
        teacher: string;
        phone?: string;
    };
    orders?: WorkshopOrder[];
    isChildRegistered?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Интерфейс подуслуги
export interface SubService {
    id: number;
    name: string;
    description?: string;
    avatar?: string;
    photos?: string[];
    video?: string;
    price: number;
    minAge: number;
    order: number;
    isActive: boolean;
    hasVariants?: boolean;
    variants?: Array<{
        id: number;
        name: string;
        description?: string;
        price: number;
        avatar?: string;
        photos?: string[];
        videos?: string[];
    }>;
}

// Интерфейс заказа в мастер-классе
export interface WorkshopOrder {
    id: number;
    childId: number;
    parentId: number;
    workshopId?: number;
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
    child: {
        id: number;
        firstName: string;
        lastName: string;
        age: number;
    };
    parent: {
        id: number;
        firstName: string;
        lastName: string;
        phone?: string;
    };
    orderComplectations?: OrderComplectation[];
    createdAt: Date;
    updatedAt: Date;
}

// Интерфейс комплектации заказа
export interface OrderComplectation {
    id: number;
    orderId: number;
    subServiceId: number;
    variantId?: number; // ID выбранного варианта (если есть)
    quantity: number;
    price: number;
    subService: SubService;
    variant?: {
        id: number;
        name: string;
        description?: string;
        price: number;
    };
    createdAt: Date;
}

// Интерфейс чата
export interface Chat {
    id: number;
    parentId: number;
    adminId: number;
    parent: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    admin: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

// Интерфейс сообщения
export interface Message {
    id: number;
    chatId: number;
    senderId: number;
    content: string;
    timestamp: Date;
    isRead: boolean;
    sender: {
        id: number;
        firstName: string;
        lastName: string;
        role: UserRole;
    };
}

// Интерфейс push-подписки
export interface PushSubscription {
    endpoint: string;
    p256dh: string;
    auth: string;
}

// Интерфейс push-уведомления
export interface PushNotification {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
}

// Интерфейс API ответа
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Интерфейс состояния аутентификации
export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Интерфейс состояния приложения
export interface AppState {
    auth: AuthState;
    // Другие состояния будут добавлены позже
}

export interface WorkshopExecutor {
    id: number;
    workshopId: number;
    executorId: number;
    assignedAt: Date;
    isPrimary: boolean;
    status: string;
    workshop: Workshop;
} 