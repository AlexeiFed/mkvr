/**
 * @file: authSlice.ts
 * @description: Redux slice для управления состоянием аутентификации
 * @dependencies: @reduxjs/toolkit
 * @created: 2024-07-06
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../services/api';

// Типы
export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'EXECUTOR' | 'PARENT' | 'CHILD';
    phone?: string;
    city?: string;
    school?: string;
    grade?: string;
    shift?: string;
    age?: number;
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    children: Child[];
}

export interface Child {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    age: number;
    school?: string;
    grade?: string;
    shift?: string;
}

// Начальное состояние
const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,
    children: [],
};

// Async thunks
export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        role?: string;
        age: number;
        schoolId?: number;
        classId?: number;
        shift?: string;
        childFirstName?: string;
        childLastName?: string;
        childAge?: number;
    }) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; password: string }) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async () => {
        await api.post('/auth/logout');
        return null;
    }
);

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
);

export const fetchChildren = createAsyncThunk(
    'auth/fetchChildren',
    async () => {
        const response = await api.get('/users/children');
        return response.data;
    }
);

export const updateUserProfile = createAsyncThunk(
    'auth/updateUserProfile',
    async (userData: Partial<User>, { getState }) => {
        const state = getState() as { auth: AuthState };
        const user = state.auth.user;

        if (!user) {
            throw new Error('Пользователь не найден');
        }

        const response = await api.put(`/users/${user.id}`, userData);
        return response.data;
    }
);

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            state.isAuthenticated = true;
            localStorage.setItem('token', action.payload);
        },
        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('token');
        },
    },
    extraReducers: (builder) => {
        // Register
        builder
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка регистрации';
            });

        // Login
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка авторизации';
                // Очищаем старый токен при ошибке входа
                localStorage.removeItem('token');
                console.log('[authSlice] Cleared token due to login error');
            });

        // Logout
        builder
            .addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.isLoading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            })
            .addCase(logoutUser.rejected, (state) => {
                state.isLoading = false;
                // Даже при ошибке выхода очищаем локальное состояние
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            });

        // Fetch current user
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения данных пользователя';
                // Если не удалось получить данные пользователя, очищаем аутентификацию
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
                console.log('[authSlice] Cleared token due to fetchCurrentUser error');
            });

        // Fetch children
        builder
            .addCase(fetchChildren.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchChildren.fulfilled, (state, action) => {
                state.isLoading = false;
                state.children = action.payload.children;
            })
            .addCase(fetchChildren.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения списка детей';
            });

        // Update user profile
        builder
            .addCase(updateUserProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления профиля';
            });
    },
});

export const { clearError, setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer; 