/**
 * @file: schoolsSlice.ts
 * @description: Redux slice для управления школами (School) с классами и сменами
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
    shift?: string;
    teacher?: string;
    phone?: string;
    note?: string;
    school?: School;
}

export interface Shift {
    id: number;
    classId: number;
    number: number;
    note?: string;
    class?: {
        id: number;
        name: string;
        school?: School;
    };
}

export interface School {
    id: number;
    name: string;
    address: string;
    note?: string;
    classes?: Class[];
    shifts?: Shift[];
}

export interface CreateSchoolData {
    name: string;
    address: string;
    note?: string;
    isActive?: boolean;
}

export interface UpdateSchoolData {
    id: number;
    name?: string;
    address?: string;
    note?: string;
    isActive?: boolean;
}

export interface CreateClassData {
    name: string;
    shift?: string;
    teacher?: string;
    phone?: string;
    note?: string;
    schoolId: number;
}

export interface UpdateClassData {
    id: number;
    name?: string;
    shift?: string;
    teacher?: string;
    phone?: string;
    note?: string;
    schoolId?: number;
}

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

        const response = await fetch('http://localhost:3001/api/schools', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения школ');
        }

        return response.json();
    }
);

export const fetchSchoolById = createAsyncThunk(
    'schools/fetchSchoolById',
    async (schoolId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/schools/${schoolId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения школы');
        }

        return response.json();
    }
);

export const createSchool = createAsyncThunk(
    'schools/createSchool',
    async (schoolData: CreateSchoolData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/schools', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(schoolData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания школы');
        }

        return response.json();
    }
);

export const updateSchool = createAsyncThunk(
    'schools/updateSchool',
    async (schoolData: UpdateSchoolData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const { id, ...updateData } = schoolData;

        const response = await fetch(`http://localhost:3001/api/schools/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления школы');
        }

        return response.json();
    }
);

export const deleteSchool = createAsyncThunk(
    'schools/deleteSchool',
    async (schoolId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/schools/${schoolId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка удаления школы');
        }

        return schoolId;
    }
);

// Async thunks для классов
export const fetchClasses = createAsyncThunk(
    'schools/fetchClasses',
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

export const fetchSchoolClasses = createAsyncThunk(
    'schools/fetchSchoolClasses',
    async (schoolId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/schools/${schoolId}/classes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения классов школы');
        }

        return response.json();
    }
);

export const createClass = createAsyncThunk(
    'schools/createClass',
    async (classData: CreateClassData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/schools/${classData.schoolId}/classes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: classData.name,
                shift: classData.shift,
                teacher: classData.teacher,
                phone: classData.phone,
                note: classData.note
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания класса');
        }

        return response.json();
    }
);

export const updateClass = createAsyncThunk(
    'schools/updateClass',
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

// Async thunks для смен
export const fetchSchoolShifts = createAsyncThunk(
    'schools/fetchSchoolShifts',
    async (schoolId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/schools/${schoolId}/shifts`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения смен школы');
        }

        return response.json();
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
        clearCurrentSchool: (state) => {
            state.currentSchool = null;
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
                state.schools = action.payload.schools;
            })
            .addCase(fetchSchools.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения школ';
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
                state.error = action.error.message || 'Ошибка получения школы';
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
                const index = state.schools.findIndex(school => school.id === action.payload.school.id);
                if (index !== -1) {
                    state.schools[index] = action.payload.school;
                }
                if (state.currentSchool?.id === action.payload.school.id) {
                    state.currentSchool = action.payload.school;
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
                state.schools = state.schools.filter(school => school.id !== action.payload);
                if (state.currentSchool?.id === action.payload) {
                    state.currentSchool = null;
                }
            })
            .addCase(deleteSchool.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления школы';
            });

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

        // fetchSchoolClasses
        builder
            .addCase(fetchSchoolClasses.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSchoolClasses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.classes = action.payload.classes;
            })
            .addCase(fetchSchoolClasses.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения классов школы';
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

                // Обновляем currentSchool
                if (state.currentSchool) {
                    state.currentSchool.classes = state.currentSchool.classes || [];
                    state.currentSchool.classes.push(action.payload.class);
                }

                // Обновляем школу в общем списке
                const schoolIndex = state.schools.findIndex(school => school.id === action.payload.class.schoolId);
                if (schoolIndex !== -1) {
                    state.schools[schoolIndex].classes = state.schools[schoolIndex].classes || [];
                    state.schools[schoolIndex].classes.push(action.payload.class);
                }
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

                // Обновляем класс в списке классов
                const classIndex = state.classes.findIndex(cls => cls.id === action.payload.class.id);
                if (classIndex !== -1) {
                    state.classes[classIndex] = action.payload.class;
                }

                // Обновляем класс в currentSchool
                if (state.currentSchool?.classes) {
                    const currentClassIndex = state.currentSchool.classes.findIndex(cls => cls.id === action.payload.class.id);
                    if (currentClassIndex !== -1) {
                        state.currentSchool.classes[currentClassIndex] = action.payload.class;
                    }
                }

                // Обновляем класс в общем списке школ
                const schoolIndex = state.schools.findIndex(school => school.id === action.payload.class.schoolId);
                if (schoolIndex !== -1 && state.schools[schoolIndex].classes) {
                    const schoolClassIndex = state.schools[schoolIndex].classes!.findIndex(cls => cls.id === action.payload.class.id);
                    if (schoolClassIndex !== -1) {
                        state.schools[schoolIndex].classes![schoolClassIndex] = action.payload.class;
                    }
                }
            })
            .addCase(updateClass.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления класса';
            });

        // fetchSchoolShifts
        builder
            .addCase(fetchSchoolShifts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSchoolShifts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.shifts = action.payload.shifts;
            })
            .addCase(fetchSchoolShifts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения смен школы';
            });
    },
});

export const { clearError, setCurrentSchool, clearCurrentSchool } = schoolsSlice.actions;
export default schoolsSlice.reducer; 