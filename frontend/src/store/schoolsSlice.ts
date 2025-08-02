/**
 * @file: schoolsSlice.ts
 * @description: Redux slice для управления школами
 * @dependencies: @reduxjs/toolkit, api
 * @created: 2024-07-06
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

// Типы данных
export interface School {
    id: number;
    name: string;
    address: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    classes?: Class[];
}

export interface Class {
    id: number;
    name: string;
    schoolId: number;
    school?: School;
    createdAt: string;
    updatedAt: string;
}

export interface Shift {
    id: number;
    name: string;
    schoolId: number;
    school?: School;
    createdAt: string;
    updatedAt: string;
}

// Состояние
export interface SchoolsState {
    schools: School[];
    currentSchool: School | null;
    classes: Class[];
    shifts: Shift[];
    isLoading: boolean;
    error: string | null;
}

// Начальное состояние
const initialState: SchoolsState = {
    schools: [],
    currentSchool: null,
    classes: [],
    shifts: [],
    isLoading: false,
    error: null,
};

// Async thunks для школ
export const fetchSchools = createAsyncThunk(
    'schools/fetchSchools',
    async (_, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await api.get('/schools', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        return response.data;
    }
);

export const fetchSchoolById = createAsyncThunk(
    'schools/fetchSchoolById',
    async (id: number) => {
        const response = await api.get(`/schools/${id}`);
        return response.data;
    }
);

export const createSchool = createAsyncThunk(
    'schools/createSchool',
    async (schoolData: Partial<School>) => {
        const response = await api.post('/schools', schoolData);
        return response.data;
    }
);

export const updateSchool = createAsyncThunk(
    'schools/updateSchool',
    async ({ id, data }: { id: number; data: Partial<School> }) => {
        const response = await api.put(`/schools/${id}`, data);
        return response.data;
    }
);

export const deleteSchool = createAsyncThunk(
    'schools/deleteSchool',
    async (id: number) => {
        await api.delete(`/schools/${id}`);
        return id;
    }
);

// Slice
const schoolsSlice = createSlice({
    name: 'schools',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentSchool: (state, action: PayloadAction<School | null>) => {
            state.currentSchool = action.payload;
        },
    },
    extraReducers: (builder) => {
        // fetchSchools
        builder
            .addCase(fetchSchools.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSchools.fulfilled, (state, action) => {
                state.isLoading = false;
                state.schools = action.payload.schools || [];
            })
            .addCase(fetchSchools.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка загрузки школ';
            });

        // fetchSchoolById
        builder
            .addCase(fetchSchoolById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSchoolById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentSchool = action.payload.school;
            })
            .addCase(fetchSchoolById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка загрузки школы';
            });

        // createSchool
        builder
            .addCase(createSchool.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createSchool.fulfilled, (state, action) => {
                state.isLoading = false;
                state.schools.push(action.payload.school);
            })
            .addCase(createSchool.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка создания школы';
            });

        // updateSchool
        builder
            .addCase(updateSchool.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateSchool.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.schools.findIndex(s => s.id === action.payload.school.id);
                if (index !== -1) {
                    state.schools[index] = action.payload.school;
                }
            })
            .addCase(updateSchool.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления школы';
            });

        // deleteSchool
        builder
            .addCase(deleteSchool.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteSchool.fulfilled, (state, action) => {
                state.isLoading = false;
                state.schools = state.schools.filter(s => s.id !== action.payload);
            })
            .addCase(deleteSchool.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления школы';
            });
    },
});

export const { clearError, setCurrentSchool } = schoolsSlice.actions;
export default schoolsSlice.reducer; 