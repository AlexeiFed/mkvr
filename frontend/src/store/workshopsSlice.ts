/**
 * @file: workshopsSlice.ts
 * @description: Redux slice для управления состоянием мастер-классов
 * @dependencies: @reduxjs/toolkit, types/index.ts
 * @created: 2024-12-19
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Workshop } from '../types';

// Дополнительные типы для мастер-классов
export interface WorkshopCreateData {
    schoolId: string;
    classId: string;
    serviceId: string;
    date: string;
    time: string;
    notes?: string;
}

export interface WorkshopUpdateData {
    schoolId?: string;
    classId?: string;
    serviceId?: string;
    date?: string;
    time?: string;
    maxParticipants?: number;
    notes?: string;
    status?: string;
}

interface WorkshopsState {
    workshops: Workshop[];
    currentWorkshop: Workshop | null;
    loading: boolean;
    error: string | null;
    filters: {
        date: string | null;
        schoolId: string | null;
        classId: string | null;
        serviceId: string | null;
    };
    statistics: {
        total: number;
        completed: number;
        upcoming: number;
        totalRevenue: number;
    };
}

const initialState: WorkshopsState = {
    workshops: [],
    currentWorkshop: null,
    loading: false,
    error: null,
    filters: {
        date: null,
        schoolId: null,
        classId: null,
        serviceId: null,
    },
    statistics: {
        total: 0,
        completed: 0,
        upcoming: 0,
        totalRevenue: 0,
    },
};

// Async thunks
export const fetchWorkshops = createAsyncThunk(
    'workshops/fetchWorkshops',
    async (filters: { date?: string | null; schoolId?: string | null; classId?: string | null; serviceId?: string | null } | undefined, { getState }) => {
        const state = getState() as { auth: { token: string | null } };
        const token = state.auth.token;

        if (!token) {
            throw new Error('Токен не найден');
        }

        const params = new URLSearchParams();
        if (filters?.date) params.append('date', filters.date);
        if (filters?.schoolId) params.append('schoolId', filters.schoolId);
        if (filters?.classId) params.append('classId', filters.classId);
        if (filters?.serviceId) params.append('serviceId', filters.serviceId);

        const response = await fetch(`http://localhost:3001/api/workshops?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Ошибка загрузки мастер-классов');
        const data = await response.json();
        return data.workshops || [];
    }
);

export const fetchWorkshopById = createAsyncThunk(
    'workshops/fetchWorkshopById',
    async (id: string, { getState }) => {
        const state = getState() as { auth: { token: string | null } };
        const token = state.auth.token;

        if (!token) {
            throw new Error('Токен не найден');
        }

        const response = await fetch(`http://localhost:3001/api/workshops/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Ошибка загрузки мастер-класса');
        const data = await response.json();
        return data.workshop;
    }
);

export const createWorkshop = createAsyncThunk(
    'workshops/createWorkshop',
    async (workshopData: WorkshopCreateData, { getState }) => {
        const state = getState() as { auth: { token: string | null } };
        const token = state.auth.token;

        if (!token) {
            throw new Error('Токен не найден');
        }

        const response = await fetch('http://localhost:3001/api/workshops', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(workshopData),
        });
        if (!response.ok) throw new Error('Ошибка создания мастер-класса');
        const data = await response.json();
        return data.workshop;
    }
);

export const updateWorkshop = createAsyncThunk(
    'workshops/updateWorkshop',
    async ({ id, data }: { id: string; data: WorkshopUpdateData }, { getState }) => {
        const state = getState() as { auth: { token: string | null } };
        const token = state.auth.token;

        if (!token) {
            throw new Error('Токен не найден');
        }

        const response = await fetch(`http://localhost:3001/api/workshops/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Ошибка обновления мастер-класса');
        const responseData = await response.json();
        return responseData.workshop;
    }
);

export const deleteWorkshop = createAsyncThunk(
    'workshops/deleteWorkshop',
    async (id: string, { getState }) => {
        const state = getState() as { auth: { token: string | null } };
        const token = state.auth.token;

        if (!token) {
            throw new Error('Токен не найден');
        }

        const response = await fetch(`http://localhost:3001/api/workshops/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Ошибка удаления мастер-класса');
        return parseInt(id);
    }
);

export const updateWorkshopPayment = createAsyncThunk(
    'workshops/updateWorkshopPayment',
    async ({ workshopId, childId, isPaid }: { workshopId: string; childId: string; isPaid: boolean }, { getState }) => {
        const state = getState() as { auth: { token: string | null } };
        const token = state.auth.token;

        if (!token) {
            throw new Error('Токен не найден');
        }

        const response = await fetch(`http://localhost:3001/api/workshops/${workshopId}/payment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ childId, isPaid }),
        });
        if (!response.ok) throw new Error('Ошибка обновления оплаты');
        const responseData = await response.json();
        return responseData.workshop;
    }
);

export const fetchWorkshopsStatistics = createAsyncThunk(
    'workshops/fetchStatistics',
    async (_, { getState }) => {
        const state = getState() as { auth: { token: string | null } };
        const token = state.auth.token;

        if (!token) {
            throw new Error('Токен не найден');
        }

        const response = await fetch('http://localhost:3001/api/workshops/statistics', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Ошибка загрузки статистики');
        const responseData = await response.json();
        return responseData.statistics;
    }
);

export const fetchChildWorkshops = createAsyncThunk(
    'workshops/fetchChildWorkshops',
    async (_, { getState }) => {
        console.log('fetchChildWorkshops: Начинаем загрузку мастер-классов для ребенка');

        const state = getState() as { auth: { token: string | null } };
        const token = state.auth.token;

        if (!token) {
            console.error('fetchChildWorkshops: Токен не найден');
            throw new Error('Токен не найден');
        }

        console.log('fetchChildWorkshops: Отправляем запрос к API');
        const response = await fetch('http://localhost:3001/api/workshops/child', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error('fetchChildWorkshops: Ошибка API:', response.status, response.statusText);
            throw new Error('Ошибка загрузки мастер-классов для ребенка');
        }

        const data = await response.json();
        console.log('fetchChildWorkshops: Получены данные:', data);
        console.log('fetchChildWorkshops: Количество мастер-классов:', data.workshops?.length || 0);

        return data.workshops || [];
    }
);

const workshopsSlice = createSlice({
    name: 'workshops',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<WorkshopsState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = { date: null, schoolId: null, classId: null, serviceId: null };
        },
        setCurrentWorkshop: (state, action: PayloadAction<Workshop | null>) => {
            state.currentWorkshop = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // fetchWorkshops
        builder
            .addCase(fetchWorkshops.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkshops.fulfilled, (state, action) => {
                state.loading = false;
                state.workshops = action.payload;
            })
            .addCase(fetchWorkshops.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка загрузки мастер-классов';
            });

        // fetchWorkshopById
        builder
            .addCase(fetchWorkshopById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkshopById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentWorkshop = action.payload;
            })
            .addCase(fetchWorkshopById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка загрузки мастер-класса';
            });

        // createWorkshop
        builder
            .addCase(createWorkshop.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWorkshop.fulfilled, (state, action) => {
                state.loading = false;
                state.workshops.push(action.payload);
            })
            .addCase(createWorkshop.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка создания мастер-класса';
            });

        // updateWorkshop
        builder
            .addCase(updateWorkshop.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateWorkshop.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.workshops.findIndex(w => w.id === action.payload.id);
                if (index !== -1) {
                    state.workshops[index] = action.payload;
                }
                if (state.currentWorkshop?.id === action.payload.id) {
                    state.currentWorkshop = action.payload;
                }
            })
            .addCase(updateWorkshop.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка обновления мастер-класса';
            });

        // deleteWorkshop
        builder
            .addCase(deleteWorkshop.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteWorkshop.fulfilled, (state, action) => {
                state.loading = false;
                state.workshops = state.workshops.filter(w => w.id !== action.payload);
                if (state.currentWorkshop?.id === action.payload) {
                    state.currentWorkshop = null;
                }
            })
            .addCase(deleteWorkshop.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка удаления мастер-класса';
            });

        // updateWorkshopPayment
        builder
            .addCase(updateWorkshopPayment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateWorkshopPayment.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.workshops.findIndex(w => w.id === action.payload.id);
                if (index !== -1) {
                    state.workshops[index] = action.payload;
                }
                if (state.currentWorkshop?.id === action.payload.id) {
                    state.currentWorkshop = action.payload;
                }
            })
            .addCase(updateWorkshopPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка обновления оплаты';
            });

        // fetchWorkshopsStatistics
        builder
            .addCase(fetchWorkshopsStatistics.fulfilled, (state, action) => {
                state.statistics = action.payload;
            });

        // fetchChildWorkshops
        builder
            .addCase(fetchChildWorkshops.pending, (state) => {
                console.log('Redux: fetchChildWorkshops.pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchChildWorkshops.fulfilled, (state, action) => {
                console.log('Redux: fetchChildWorkshops.fulfilled, количество мастер-классов:', action.payload.length);
                state.loading = false;
                state.workshops = action.payload;
            })
            .addCase(fetchChildWorkshops.rejected, (state, action) => {
                console.error('Redux: fetchChildWorkshops.rejected:', action.error.message);
                state.loading = false;
                state.error = action.error.message || 'Ошибка загрузки мастер-классов для ребенка';
            });
    },
});

export const { setFilters, clearFilters, setCurrentWorkshop, clearError } = workshopsSlice.actions;
export default workshopsSlice.reducer; 