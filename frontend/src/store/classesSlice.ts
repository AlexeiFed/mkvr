/**
 * @file: classesSlice.ts
 * @description: Redux slice для управления классами (Class)
 * @dependencies: @reduxjs/toolkit
 * @created: 2024-07-06
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Типы
export interface Class {
    id: number;
    schoolId: number;
    name: string;
    note?: string;
    school?: {
        id: number;
        name: string;
        address: string;
    };
}

export interface CreateClassData {
    name: string;
    note?: string;
    schoolId: number;
}

export interface UpdateClassData {
    id: number;
    name?: string;
    note?: string;
    schoolId?: number;
}

export interface ClassesState {
    classes: Class[];
    currentClass: Class | null;
    isLoading: boolean;
    error: string | null;
}

// Начальное состояние
const initialState: ClassesState = {
    classes: [],
    currentClass: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchClasses = createAsyncThunk(
    'classes/fetchClasses',
    async (_, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/classes', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения классов');
        }

        return response.json();
    }
);

export const fetchClassById = createAsyncThunk(
    'classes/fetchClassById',
    async (classId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/classes/${classId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения класса');
        }

        return response.json();
    }
);

export const createClass = createAsyncThunk(
    'classes/createClass',
    async (classData: CreateClassData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/classes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(classData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания класса');
        }

        return response.json();
    }
);

export const updateClass = createAsyncThunk(
    'classes/updateClass',
    async (classData: UpdateClassData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const { id, ...updateData } = classData;

        const response = await fetch(`http://localhost:3001/api/classes/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления класса');
        }

        return response.json();
    }
);

export const deleteClass = createAsyncThunk(
    'classes/deleteClass',
    async (classId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/classes/${classId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка удаления класса');
        }

        return classId;
    }
);

// Slice
const classesSlice = createSlice({
    name: 'classes',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentClass: (state, action: PayloadAction<Class | null>) => {
            state.currentClass = action.payload;
        },
        clearCurrentClass: (state) => {
            state.currentClass = null;
        },
    },
    extraReducers: (builder) => {
        // fetchClasses
        builder
            .addCase(fetchClasses.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchClasses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.classes = action.payload.classes;
            })
            .addCase(fetchClasses.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения классов';
            });

        // fetchClassById
        builder
            .addCase(fetchClassById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchClassById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentClass = action.payload.class;
            })
            .addCase(fetchClassById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения класса';
            });

        // createClass
        builder
            .addCase(createClass.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createClass.fulfilled, (state, action) => {
                state.isLoading = false;
                state.classes.push(action.payload.class);
            })
            .addCase(createClass.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка создания класса';
            });

        // updateClass
        builder
            .addCase(updateClass.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateClass.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.classes.findIndex(cls => cls.id === action.payload.class.id);
                if (index !== -1) {
                    state.classes[index] = action.payload.class;
                }
                if (state.currentClass?.id === action.payload.class.id) {
                    state.currentClass = action.payload.class;
                }
            })
            .addCase(updateClass.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления класса';
            });

        // deleteClass
        builder
            .addCase(deleteClass.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteClass.fulfilled, (state, action) => {
                state.isLoading = false;
                state.classes = state.classes.filter(cls => cls.id !== action.payload);
                if (state.currentClass?.id === action.payload) {
                    state.currentClass = null;
                }
            })
            .addCase(deleteClass.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления класса';
            });
    },
});

export const { clearError, setCurrentClass, clearCurrentClass } = classesSlice.actions;
export default classesSlice.reducer; 