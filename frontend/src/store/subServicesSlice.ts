/**
 * @file: subServicesSlice.ts
 * @description: Redux slice для управления комплектацией
 * @dependencies: @reduxjs/toolkit, react-redux
 * @created: 2024-07-07
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Типы
export interface SubServiceVariant {
    id?: number;
    name: string;
    description: string;
    price: number;
    order: number;
    avatar?: string;
    photos: string[];
    videos: string[]; // Изменено с video?: string на videos: string[]
}

export interface SubService {
    id: number;
    serviceId: number;
    name: string;
    description?: string;
    avatar?: string;
    photos: string[];
    video?: string;
    minAge: number;
    order?: number;
    isActive: boolean;
    hasVariants: boolean;
    price: number; // Цена для комплектаций без вариантов
    createdAt: string;
    updatedAt: string;
    service?: {
        id: number;
        name: string;
        description?: string;
    };
    variants: SubServiceVariant[];
}

export interface CreateSubServiceData {
    name: string;
    description?: string;
    avatar?: string;
    photos?: string[];
    video?: string;
    serviceId: number;
    minAge: number;
    hasVariants?: boolean;
    price?: number; // Цена для комплектаций без вариантов
    variants?: CreateSubServiceVariantData[];
}

export interface CreateSubServiceVariantData {
    name: string;
    description: string;
    price: number;
    order: number;
    avatar?: string;
    photos: string[];
    videos: string[]; // Изменено с video?: string на videos: string[]
}

export interface UpdateSubServiceData {
    id: number;
    name?: string;
    description?: string;
    avatar?: string;
    photos?: string[];
    video?: string;
    serviceId?: number;
    isActive?: boolean;
    minAge?: number;
    hasVariants?: boolean;
    price?: number; // Цена для комплектаций без вариантов
    variants?: CreateSubServiceVariantData[];
}

export interface SubServicesState {
    subServices: SubService[];
    currentSubService: SubService | null;
    isLoading: boolean;
    error: string | null;
}

// Начальное состояние
const initialState: SubServicesState = {
    subServices: [],
    currentSubService: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchSubServices = createAsyncThunk(
    'subServices/fetchSubServices',
    async (_, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/subServices', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения комплектации');
        }

        return response.json();
    }
);

export const fetchSubServiceById = createAsyncThunk(
    'subServices/fetchSubServiceById',
    async (id: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/subServices/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения комплектации');
        }

        return response.json();
    }
);

export const fetchSubServicesByService = createAsyncThunk(
    'subServices/fetchSubServicesByService',
    async (serviceId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/subServices/service/${serviceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения комплектации услуги');
        }

        return response.json();
    }
);

export const createSubService = createAsyncThunk(
    'subServices/createSubService',
    async (subServiceData: CreateSubServiceData, { getState }) => {
        console.log('[createSubService] вызван с данными:', subServiceData);
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch('http://localhost:3001/api/subServices', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subServiceData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания комплектации');
        }

        return response.json();
    }
);

export const updateSubService = createAsyncThunk(
    'subServices/updateSubService',
    async (subServiceData: UpdateSubServiceData, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const { id, ...updateData } = subServiceData;

        const response = await fetch(`http://localhost:3001/api/subServices/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления комплектации');
        }

        return response.json();
    }
);

export const deleteSubService = createAsyncThunk(
    'subServices/deleteSubService',
    async (id: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/subServices/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка удаления комплектации');
        }

        return id;
    }
);

export const fetchSubServiceVariants = createAsyncThunk(
    'subServices/fetchSubServiceVariants',
    async (subServiceId: number, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/subServices/${subServiceId}/variants`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка получения вариантов');
        }

        return response.json();
    }
);

export const createSubServiceVariant = createAsyncThunk(
    'subServices/createSubServiceVariant',
    async ({ subServiceId, variantData }: { subServiceId: number; variantData: CreateSubServiceVariantData }, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/subServices/${subServiceId}/variants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(variantData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания варианта');
        }

        return response.json();
    }
);

export const updateSubServiceVariant = createAsyncThunk(
    'subServices/updateSubServiceVariant',
    async ({ subServiceId, variantId, variantData }: { subServiceId: number; variantId: number; variantData: Partial<CreateSubServiceVariantData> }, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/subServices/${subServiceId}/variants/${variantId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(variantData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления варианта');
        }

        return response.json();
    }
);

export const deleteSubServiceVariant = createAsyncThunk(
    'subServices/deleteSubServiceVariant',
    async ({ subServiceId, variantId }: { subServiceId: number; variantId: number }, { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/subServices/${subServiceId}/variants/${variantId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка удаления варианта');
        }

        return { subServiceId, variantId };
    }
);

export const updateSubServiceOrder = createAsyncThunk(
    'subServices/updateSubServiceOrder',
    async (orders: { id: number; order: number }[], { getState }) => {
        const state = getState() as { auth: { token: string } };
        const token = state.auth.token;

        const response = await fetch(`http://localhost:3001/api/subServices/order`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orders }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления порядка комплектаций');
        }

        return response.json();
    }
);

// Slice
const subServicesSlice = createSlice({
    name: 'subServices',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentSubService: (state, action: PayloadAction<SubService | null>) => {
            state.currentSubService = action.payload;
        },
        clearCurrentSubService: (state) => {
            state.currentSubService = null;
        },
    },
    extraReducers: (builder) => {
        // fetchSubServices
        builder
            .addCase(fetchSubServices.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSubServices.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subServices = action.payload.subServices;
            })
            .addCase(fetchSubServices.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения подуслуг';
            });

        // fetchSubServiceById
        builder
            .addCase(fetchSubServiceById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSubServiceById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentSubService = action.payload.subService;
            })
            .addCase(fetchSubServiceById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения подуслуги';
            });

        // fetchSubServicesByService
        builder
            .addCase(fetchSubServicesByService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSubServicesByService.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subServices = action.payload.subServices;
            })
            .addCase(fetchSubServicesByService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения подуслуг услуги';
            });

        // createSubService
        builder
            .addCase(createSubService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createSubService.fulfilled, (state, action) => {
                state.isLoading = false;
                const newSubService = action.payload.subService;
                state.subServices.push(newSubService);
            })
            .addCase(createSubService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка создания подуслуги';
            });

        // updateSubService
        builder
            .addCase(updateSubService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateSubService.fulfilled, (state, action) => {
                state.isLoading = false;
                const updatedSubService = action.payload.subService;
                const index = state.subServices.findIndex(subService => subService.id === updatedSubService.id);
                if (index !== -1) {
                    state.subServices[index] = updatedSubService;
                }
                if (state.currentSubService?.id === updatedSubService.id) {
                    state.currentSubService = updatedSubService;
                }
            })
            .addCase(updateSubService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления подуслуги';
            });

        // deleteSubService
        builder
            .addCase(deleteSubService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteSubService.fulfilled, (state, action) => {
                state.isLoading = false;
                const deletedId = action.payload;
                state.subServices = state.subServices.filter(subService => subService.id !== deletedId);
                if (state.currentSubService?.id === deletedId) {
                    state.currentSubService = null;
                }
            })
            .addCase(deleteSubService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления подуслуги';
            });

        // fetchSubServiceVariants
        builder
            .addCase(fetchSubServiceVariants.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSubServiceVariants.fulfilled, (state, action) => {
                state.isLoading = false;
                // Обновляем варианты в соответствующей комплектации
                const variants = action.payload.variants;
                const subService = state.subServices.find(s => s.id === variants[0]?.subServiceId);
                if (subService) {
                    subService.variants = variants;
                }
                if (state.currentSubService && state.currentSubService.id === variants[0]?.subServiceId) {
                    state.currentSubService.variants = variants;
                }
            })
            .addCase(fetchSubServiceVariants.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения вариантов';
            });

        // createSubServiceVariant
        builder
            .addCase(createSubServiceVariant.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createSubServiceVariant.fulfilled, (state, action) => {
                state.isLoading = false;
                const newVariant = action.payload.variant;
                const subService = state.subServices.find(s => s.id === newVariant.subServiceId);
                if (subService) {
                    subService.variants.push(newVariant);
                }
                if (state.currentSubService && state.currentSubService.id === newVariant.subServiceId) {
                    state.currentSubService.variants.push(newVariant);
                }
            })
            .addCase(createSubServiceVariant.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка создания варианта';
            });

        // updateSubServiceVariant
        builder
            .addCase(updateSubServiceVariant.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateSubServiceVariant.fulfilled, (state, action) => {
                state.isLoading = false;
                const updatedVariant = action.payload.variant;
                const subService = state.subServices.find(s => s.id === updatedVariant.subServiceId);
                if (subService) {
                    const index = subService.variants.findIndex(v => v.id === updatedVariant.id);
                    if (index !== -1) {
                        subService.variants[index] = updatedVariant;
                    }
                }
                if (state.currentSubService && state.currentSubService.id === updatedVariant.subServiceId) {
                    const index = state.currentSubService.variants.findIndex(v => v.id === updatedVariant.id);
                    if (index !== -1) {
                        state.currentSubService.variants[index] = updatedVariant;
                    }
                }
            })
            .addCase(updateSubServiceVariant.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления варианта';
            });

        // updateSubServiceOrder
        builder
            .addCase(updateSubServiceOrder.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateSubServiceOrder.fulfilled, (state) => {
                state.isLoading = false;
                // Обновляем порядок в локальном состоянии
                // Порядок будет обновлен при следующей загрузке данных
            })
            .addCase(updateSubServiceOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления порядка комплектаций';
            });

        // deleteSubServiceVariant
        builder
            .addCase(deleteSubServiceVariant.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteSubServiceVariant.fulfilled, (state, action) => {
                state.isLoading = false;
                const { subServiceId, variantId } = action.payload;
                const subService = state.subServices.find(s => s.id === subServiceId);
                if (subService) {
                    subService.variants = subService.variants.filter(v => v.id !== variantId);
                }
                if (state.currentSubService && state.currentSubService.id === subServiceId) {
                    state.currentSubService.variants = state.currentSubService.variants.filter(v => v.id !== variantId);
                }
            })
            .addCase(deleteSubServiceVariant.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления варианта';
            });
    },
});

export const { clearError, setCurrentSubService, clearCurrentSubService } = subServicesSlice.actions;
export default subServicesSlice.reducer; 