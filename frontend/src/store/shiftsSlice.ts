/**
 * @file: shiftsSlice.ts
 * @description: Redux slice для управления сменами (Shift)
 * @dependencies: @reduxjs/toolkit
 * @created: 2024-07-06
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Типы
export interface Shift {
    id: number;
    classId: number;
    number: number;
    note?: string;
    class?: {
        id: number;
        name: string;
        school?: {
            id: number;
            name: string;
            address: string;
        };
    };
}

export interface CreateShiftData {
    number: number;
    note?: string;
    classId: number;
}

export interface UpdateShiftData {
    id: number;
    number?: number;
    note?: string;
    classId?: number;
}

export interface ShiftsState {
    shifts: Shift[];
    currentShift: Shift | null;
    isLoading: boolean;
    error: string | null;
}

// Начальное состояние
const initialState: ShiftsState = {
    shifts: [],
    currentShift: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchShifts = createAsyncThunk(
    'shifts/fetchShifts',
    async (_, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/shifts', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения смен');
        }

        return response.json();
    }
);

export const fetchShiftById = createAsyncThunk(
    'shifts/fetchShiftById',
    async (shiftId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/shifts/${shiftId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения смены');
        }

        return response.json();
    }
);

export const createShift = createAsyncThunk(
    'shifts/createShift',
    async (shiftData: CreateShiftData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/shifts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shiftData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания смены');
        }

        return response.json();
    }
);

export const updateShift = createAsyncThunk(
    'shifts/updateShift',
    async (shiftData: UpdateShiftData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const { id, ...updateData } = shiftData;

        const response = await fetch(`http://localhost:3001/api/shifts/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления смены');
        }

        return response.json();
    }
);

export const deleteShift = createAsyncThunk(
    'shifts/deleteShift',
    async (shiftId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/shifts/${shiftId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка удаления смены');
        }

        return shiftId;
    }
);

// Slice
const shiftsSlice = createSlice({
    name: 'shifts',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentShift: (state, action: PayloadAction<Shift | null>) => {
            state.currentShift = action.payload;
        },
        clearCurrentShift: (state) => {
            state.currentShift = null;
        },
    },
    extraReducers: (builder) => {
        // fetchShifts
        builder
            .addCase(fetchShifts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchShifts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.shifts = action.payload.shifts;
            })
            .addCase(fetchShifts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения смен';
            });

        // fetchShiftById
        builder
            .addCase(fetchShiftById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchShiftById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentShift = action.payload.shift;
            })
            .addCase(fetchShiftById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения смены';
            });

        // createShift
        builder
            .addCase(createShift.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createShift.fulfilled, (state, action) => {
                state.isLoading = false;
                state.shifts.push(action.payload.shift);
            })
            .addCase(createShift.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка создания смены';
            });

        // updateShift
        builder
            .addCase(updateShift.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateShift.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.shifts.findIndex(shift => shift.id === action.payload.shift.id);
                if (index !== -1) {
                    state.shifts[index] = action.payload.shift;
                }
                if (state.currentShift?.id === action.payload.shift.id) {
                    state.currentShift = action.payload.shift;
                }
            })
            .addCase(updateShift.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления смены';
            });

        // deleteShift
        builder
            .addCase(deleteShift.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteShift.fulfilled, (state, action) => {
                state.isLoading = false;
                state.shifts = state.shifts.filter(shift => shift.id !== action.payload);
                if (state.currentShift?.id === action.payload) {
                    state.currentShift = null;
                }
            })
            .addCase(deleteShift.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления смены';
            });
    },
});

export const { clearError, setCurrentShift, clearCurrentShift } = shiftsSlice.actions;
export default shiftsSlice.reducer; 