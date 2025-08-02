/**
 * @file: subServicesSlice.ts
 * @description: Redux slice для управления комплектациями услуг (SubService)
 * @dependencies: @reduxjs/toolkit
 * @created: 2024-07-06
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../services/api';

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
    async () => {
        const response = await api.get('/subServices');
        return response.data;
    }
);

export const fetchSubServiceById = createAsyncThunk(
    'subServices/fetchSubServiceById',
    async (id: number) => {
        const response = await api.get(`/subServices/${id}`);
        return response.data;
    }
);

export const fetchSubServicesByService = createAsyncThunk(
    'subServices/fetchSubServicesByService',
    async (serviceId: number) => {
        const response = await api.get(`/subServices/service/${serviceId}`);
        return response.data;
    }
);

export const createSubService = createAsyncThunk(
    'subServices/createSubService',
    async (subServiceData: CreateSubServiceData) => {
        console.log('[createSubService] вызван с данными:', subServiceData);
        const response = await api.post('/subServices', subServiceData);
        return response.data;
    }
);

export const updateSubService = createAsyncThunk(
    'subServices/updateSubService',
    async (subServiceData: UpdateSubServiceData) => {
        const { id, ...updateData } = subServiceData;
        const response = await api.put(`/subServices/${id}`, updateData);
        return response.data;
    }
);

export const deleteSubService = createAsyncThunk(
    'subServices/deleteSubService',
    async (id: number) => {
        await api.delete(`/subServices/${id}`);
        return id;
    }
);

export const fetchSubServiceVariants = createAsyncThunk(
    'subServices/fetchSubServiceVariants',
    async (subServiceId: number) => {
        const response = await api.get(`/subServices/${subServiceId}/variants`);
        return { subServiceId, variants: response.data.variants };
    }
);

export const createSubServiceVariant = createAsyncThunk(
    'subServices/createSubServiceVariant',
    async ({ subServiceId, variantData }: { subServiceId: number; variantData: CreateSubServiceVariantData }) => {
        const response = await api.post(`/subServices/${subServiceId}/variants`, variantData);
        return { subServiceId, variant: response.data.variant };
    }
);

export const updateSubServiceVariant = createAsyncThunk(
    'subServices/updateSubServiceVariant',
    async ({ subServiceId, variantId, variantData }: { subServiceId: number; variantId: number; variantData: Partial<CreateSubServiceVariantData> }) => {
        const response = await api.put(`/subServices/${subServiceId}/variants/${variantId}`, variantData);
        return { subServiceId, variant: response.data.variant };
    }
);

export const deleteSubServiceVariant = createAsyncThunk(
    'subServices/deleteSubServiceVariant',
    async ({ subServiceId, variantId }: { subServiceId: number; variantId: number }) => {
        await api.delete(`/subServices/${subServiceId}/variants/${variantId}`);
        return { subServiceId, variantId };
    }
);

export const updateSubServiceOrder = createAsyncThunk(
    'subServices/updateSubServiceOrder',
    async (orderData: { id: number; order: number }[]) => {
        const response = await api.post('/subServices/order', { order: orderData });
        return response.data;
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
                state.subServices = action.payload.subServices || [];
            })
            .addCase(fetchSubServices.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения комплектаций';
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
                state.error = action.error.message || 'Ошибка получения комплектации';
            });

        // fetchSubServicesByService
        builder
            .addCase(fetchSubServicesByService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSubServicesByService.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subServices = action.payload.subServices || [];
            })
            .addCase(fetchSubServicesByService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения комплектаций услуги';
            });

        // createSubService
        builder
            .addCase(createSubService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createSubService.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subServices.push(action.payload.subService);
            })
            .addCase(createSubService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка создания комплектации';
            });

        // updateSubService
        builder
            .addCase(updateSubService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateSubService.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.subServices.findIndex(s => s.id === action.payload.subService.id);
                if (index !== -1) {
                    state.subServices[index] = action.payload.subService;
                }
                if (state.currentSubService?.id === action.payload.subService.id) {
                    state.currentSubService = action.payload.subService;
                }
            })
            .addCase(updateSubService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления комплектации';
            });

        // deleteSubService
        builder
            .addCase(deleteSubService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteSubService.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subServices = state.subServices.filter(s => s.id !== action.payload);
                if (state.currentSubService?.id === action.payload) {
                    state.currentSubService = null;
                }
            })
            .addCase(deleteSubService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления комплектации';
            });

        // fetchSubServiceVariants
        builder
            .addCase(fetchSubServiceVariants.fulfilled, (state, action) => {
                const { subServiceId, variants } = action.payload;
                const subService = state.subServices.find(s => s.id === subServiceId);
                if (subService) {
                    subService.variants = variants;
                }
                if (state.currentSubService?.id === subServiceId) {
                    state.currentSubService.variants = variants;
                }
            });

        // createSubServiceVariant
        builder
            .addCase(createSubServiceVariant.fulfilled, (state, action) => {
                const { subServiceId, variant } = action.payload;
                const subService = state.subServices.find(s => s.id === subServiceId);
                if (subService) {
                    subService.variants.push(variant);
                }
                if (state.currentSubService?.id === subServiceId) {
                    state.currentSubService.variants.push(variant);
                }
            });

        // updateSubServiceVariant
        builder
            .addCase(updateSubServiceVariant.fulfilled, (state, action) => {
                const { subServiceId, variant } = action.payload;
                const subService = state.subServices.find(s => s.id === subServiceId);
                if (subService) {
                    const variantIndex = subService.variants.findIndex(v => v.id === variant.id);
                    if (variantIndex !== -1) {
                        subService.variants[variantIndex] = variant;
                    }
                }
                if (state.currentSubService?.id === subServiceId) {
                    const variantIndex = state.currentSubService.variants.findIndex(v => v.id === variant.id);
                    if (variantIndex !== -1) {
                        state.currentSubService.variants[variantIndex] = variant;
                    }
                }
            });

        // deleteSubServiceVariant
        builder
            .addCase(deleteSubServiceVariant.fulfilled, (state, action) => {
                const { subServiceId, variantId } = action.payload;
                const subService = state.subServices.find(s => s.id === subServiceId);
                if (subService) {
                    subService.variants = subService.variants.filter(v => v.id !== variantId);
                }
                if (state.currentSubService?.id === subServiceId) {
                    state.currentSubService.variants = state.currentSubService.variants.filter(v => v.id !== variantId);
                }
            });

        // updateSubServiceOrder
        builder
            .addCase(updateSubServiceOrder.fulfilled, (state, action) => {
                // Обновляем порядок в state
                action.payload.subServices.forEach((updatedSubService: SubService) => {
                    const index = state.subServices.findIndex(s => s.id === updatedSubService.id);
                    if (index !== -1) {
                        state.subServices[index] = updatedSubService;
                    }
                });
            });
    },
});

export const { clearError, setCurrentSubService, clearCurrentSubService } = subServicesSlice.actions;
export default subServicesSlice.reducer; 