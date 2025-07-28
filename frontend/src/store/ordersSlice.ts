/**
 * @file: ordersSlice.ts
 * @description: Redux slice для управления заказами
 * @dependencies: @reduxjs/toolkit
 * @created: 2024-07-06
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Типы
export interface OrderComplectation {
    id: number;
    orderId: number;
    subServiceId: number;
    variantId?: number;
    quantity: number;
    price: number;
    createdAt: string;
    subService: {
        id: number;
        name: string;
        minAge: number;
        hasVariants: boolean;
        variants: Array<{
            id: number;
            name: string;
            description?: string;
            price: number;
        }>;
    };
    variant?: {
        id: number;
        name: string;
        description?: string;
        price: number;
    };
}

export interface Order {
    id: number;
    childId: number;
    parentId: number;
    workshopId: number;
    notes?: string;
    status: 'pending' | 'paid' | 'completed' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    amount: number;
    workshopDate: string;
    createdAt: string;
    updatedAt: string;
    child?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        age?: number;
    };
    parent?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    orderComplectations?: OrderComplectation[];
}

export interface SelectedComplectation {
    subServiceId: number;
    variantId?: number;
    variants?: Array<{
        id: number;
        name: string;
        description?: string;
        price: number;
    }>;
}

export interface CreateOrderData {
    childId: number;
    parentId: number;
    workshopId: number;
    notes?: string;
    selectedComplectations: SelectedComplectation[];
}

export interface UpdateOrderData {
    id: number;
    workshopId?: number;
    notes?: string;
    status?: 'pending' | 'paid' | 'completed' | 'cancelled';
    paymentStatus?: 'pending' | 'paid' | 'refunded';
    amount?: number;
    workshopDate?: string;
    selectedComplectations?: SelectedComplectation[];
}

export interface OrdersState {
    orders: Order[];
    currentOrder: Order | null;
    isLoading: boolean;
    error: string | null;
}

// Начальное состояние
const initialState: OrdersState = {
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async (_, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения заказов');
        }

        return response.json();
    }
);

export const fetchOrderById = createAsyncThunk(
    'orders/fetchOrderById',
    async (orderId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения заказа');
        }

        return response.json();
    }
);

export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (orderData: CreateOrderData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания заказа');
        }

        return response.json();
    }
);

export const updateOrder = createAsyncThunk(
    'orders/updateOrder',
    async (orderData: UpdateOrderData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const { id, ...updateData } = orderData;

        const response = await fetch(`http://localhost:3001/api/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления заказа');
        }

        return response.json();
    }
);

export const deleteOrder = createAsyncThunk(
    'orders/deleteOrder',
    async (orderId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка удаления заказа');
        }

        return orderId;
    }
);

// Slice
const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
            state.currentOrder = action.payload;
        },
        clearOrders: (state) => {
            state.orders = [];
            state.currentOrder = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch orders
        builder
            .addCase(fetchOrders.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.isLoading = false;
                state.orders = action.payload.orders || action.payload;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения заказов';
            });

        // Fetch order by ID
        builder
            .addCase(fetchOrderById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentOrder = action.payload.order || action.payload;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения заказа';
            });

        // Create order
        builder
            .addCase(createOrder.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                const newOrder = action.payload.order || action.payload;
                state.orders.push(newOrder);
                state.currentOrder = newOrder;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка создания заказа';
            });

        // Update order
        builder
            .addCase(updateOrder.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                const updatedOrder = action.payload.order || action.payload;
                const index = state.orders.findIndex(order => order.id === updatedOrder.id);
                if (index !== -1) {
                    state.orders[index] = updatedOrder;
                }
                if (state.currentOrder?.id === updatedOrder.id) {
                    state.currentOrder = updatedOrder;
                }
            })
            .addCase(updateOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления заказа';
            });

        // Delete order
        builder
            .addCase(deleteOrder.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                const deletedOrderId = action.payload;
                state.orders = state.orders.filter(order => order.id !== deletedOrderId);
                if (state.currentOrder?.id === deletedOrderId) {
                    state.currentOrder = null;
                }
            })
            .addCase(deleteOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления заказа';
            });
    },
});

export const { clearError, setCurrentOrder, clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer; 