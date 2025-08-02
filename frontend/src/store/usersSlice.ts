/**
 * @file: usersSlice.ts
 * @description: Redux slice для управления пользователями (админ)
 * @dependencies: redux-toolkit, types, API users
 * @created: 2025-07-25
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';
import { api } from '../services/api';

export interface UsersState {
    users: User[];
    total: number;
    currentUser: User | null;
    isLoading: boolean;
    error: string | null;
    filters: {
        school?: string;
        grade?: string;
        city?: string;
        role?: string;
        page: number;
        pageSize: number;
    };
}

const initialState: UsersState = {
    users: [],
    total: 0,
    currentUser: null,
    isLoading: false,
    error: null,
    filters: {
        page: 1,
        pageSize: 20,
    },
};

export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (filters: Partial<UsersState['filters']> = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) params.append(key, String(value));
        });
        const response = await api.get(`/users?${params.toString()}`);
        return response.data;
    }
);

export const fetchUserById = createAsyncThunk(
    'users/fetchUserById',
    async (id: number) => {
        const response = await api.get(`/users/${id}`);
        return response.data.user;
    }
);

export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (id: number) => {
        await api.delete(`/users/${id}`);
        return id;
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        setFilters(state, action: PayloadAction<Partial<UsersState['filters']>>) {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users = action.payload.users;
                state.total = action.payload.total;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения пользователей';
            })
            .addCase(fetchUserById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения пользователя';
            })
            .addCase(deleteUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users = state.users.filter(u => u.id !== action.payload);
                state.total -= 1;
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления пользователя';
            });
    },
});

export const { setFilters, clearError } = usersSlice.actions;
export default usersSlice.reducer; 