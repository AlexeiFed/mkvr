/**
 * @file: workshopsSlice.ts
 * @description: Redux slice для управления состоянием мастер-классов
 * @dependencies: @reduxjs/toolkit, types/index.ts
 * @created: 2024-12-19
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Workshop } from '../types';
import { api } from '../services/api';

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
        city: string | null;
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
        city: null,
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
    async (filters: { date?: string | null; city?: string | null; schoolId?: string | null; classId?: string | null; serviceId?: string | null } | undefined) => {
        const params = new URLSearchParams();
        if (filters?.date) params.append('date', filters.date);
        if (filters?.city) params.append('city', filters.city);
        if (filters?.schoolId) params.append('schoolId', filters.schoolId);
        if (filters?.classId) params.append('classId', filters.classId);
        if (filters?.serviceId) params.append('serviceId', filters.serviceId);

        const response = await api.get(`/workshops?${params.toString()}`);
        return response.data.workshops || [];
    }
);

export const fetchWorkshopById = createAsyncThunk(
    'workshops/fetchWorkshopById',
    async (id: string) => {
        const response = await api.get(`/workshops/${id}`);
        return response.data.workshop;
    }
);

export const createWorkshop = createAsyncThunk(
    'workshops/createWorkshop',
    async (workshopData: WorkshopCreateData) => {
        const response = await api.post('/workshops', workshopData);
        return response.data.workshop;
    }
);

export const updateWorkshop = createAsyncThunk(
    'workshops/updateWorkshop',
    async ({ id, data }: { id: string; data: WorkshopUpdateData }) => {
        const response = await api.put(`/workshops/${id}`, data);
        return response.data.workshop;
    }
);

export const deleteWorkshop = createAsyncThunk(
    'workshops/deleteWorkshop',
    async (id: string) => {
        await api.delete(`/workshops/${id}`);
        return parseInt(id);
    }
);

export const updateWorkshopPayment = createAsyncThunk(
    'workshops/updateWorkshopPayment',
    async ({ workshopId, childId, isPaid }: { workshopId: string; childId: string; isPaid: boolean }) => {
        const response = await api.put(`/workshops/${workshopId}/payment`, { childId, isPaid });
        const responseData = await response.data;
        return responseData.workshop;
    }
);

export const fetchWorkshopsStatistics = createAsyncThunk(
    'workshops/fetchStatistics',
    async () => {
        const response = await api.get('/workshops/statistics');
        return response.data.statistics;
    }
);

export const fetchChildWorkshops = createAsyncThunk(
    'workshops/fetchChildWorkshops',
    async () => {
        console.log('fetchChildWorkshops: Начинаем загрузку мастер-классов для ребенка');
        console.log('fetchChildWorkshops: Отправляем запрос к API');

        const response = await api.get('/workshops/child');

        const data = response.data;
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
            state.filters = { date: null, city: null, schoolId: null, classId: null, serviceId: null };
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