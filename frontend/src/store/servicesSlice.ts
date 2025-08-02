/**
 * @file: servicesSlice.ts
 * @description: Redux slice для управления услугами (Service)
 * @dependencies: @reduxjs/toolkit
 * @created: 2024-07-06
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { addSubServiceToService, updateSubServiceInService, removeSubServiceFromService } from './actions';
import { updateSubServiceOrder } from './subServicesSlice';
import { api } from '../services/api';

// Типы
export interface SubServiceVariant {
    id?: number;
    name: string;
    description?: string;
    price: number;
    avatar?: string;
    photos: string[];
    video?: string;
    order: number;
    isActive: boolean;
}

export interface Service {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    subServices?: SubService[];
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
    price: number;
    createdAt: string;
    updatedAt: string;
    variants: SubServiceVariant[];
}

export interface CreateServiceData {
    name: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateServiceData {
    id: number;
    name?: string;
    description?: string;
    isActive?: boolean;
}

export interface ServicesState {
    services: Service[];
    currentService: Service | null;
    isLoading: boolean;
    error: string | null;
}

// Начальное состояние
const initialState: ServicesState = {
    services: [],
    currentService: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchServices = createAsyncThunk(
    'services/fetchServices',
    async () => {
        const response = await api.get('/services');
        return response.data;
    }
);

export const fetchServiceById = createAsyncThunk(
    'services/fetchServiceById',
    async (serviceId: number) => {
        const response = await api.get(`/services/${serviceId}`);
        return response.data;
    }
);

export const createService = createAsyncThunk(
    'services/createService',
    async (serviceData: CreateServiceData) => {
        const response = await api.post('/services', serviceData);
        return response.data;
    }
);

export const updateService = createAsyncThunk(
    'services/updateService',
    async (serviceData: UpdateServiceData) => {
        const { id, ...updateData } = serviceData;
        const response = await api.put(`/services/${id}`, updateData);
        return response.data;
    }
);

export const deleteService = createAsyncThunk(
    'services/deleteService',
    async (serviceId: number) => {
        await api.delete(`/services/${serviceId}`);
        return serviceId;
    }
);

// Slice
const servicesSlice = createSlice({
    name: 'services',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentService: (state, action: PayloadAction<Service | null>) => {
            state.currentService = action.payload;
        },
        clearCurrentService: (state) => {
            state.currentService = null;
        },
    },
    extraReducers: (builder) => {
        // fetchServices
        builder
            .addCase(fetchServices.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchServices.fulfilled, (state, action) => {
                state.isLoading = false;
                state.services = action.payload.services;
            })
            .addCase(fetchServices.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения услуг';
            });

        // fetchServiceById
        builder
            .addCase(fetchServiceById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchServiceById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentService = action.payload.service;
            })
            .addCase(fetchServiceById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка получения услуги';
            });

        // createService
        builder
            .addCase(createService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createService.fulfilled, (state, action) => {
                state.isLoading = false;
                state.services.push(action.payload.service);
            })
            .addCase(createService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка создания услуги';
            });

        // updateService
        builder
            .addCase(updateService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateService.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.services.findIndex(service => service.id === action.payload.service.id);
                if (index !== -1) {
                    state.services[index] = action.payload.service;
                }
                if (state.currentService?.id === action.payload.service.id) {
                    state.currentService = action.payload.service;
                }
            })
            .addCase(updateService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка обновления услуги';
            });

        // deleteService
        builder
            .addCase(deleteService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteService.fulfilled, (state, action) => {
                state.isLoading = false;
                state.services = state.services.filter(service => service.id !== action.payload);
                if (state.currentService?.id === action.payload) {
                    state.currentService = null;
                }
            })
            .addCase(deleteService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Ошибка удаления услуги';
            });

        // Синхронизация с комплектациями
        builder
            .addCase(addSubServiceToService, (state, action) => {
                const { serviceId, subService } = action.payload;
                console.log('addSubServiceToService вызван:', { serviceId, subService });

                const service = state.services.find(s => s.id === serviceId);
                if (service) {
                    if (!service.subServices) {
                        service.subServices = [];
                    }
                    service.subServices.push({ ...subService, variants: subService.variants || [] });
                    console.log('Комплектация добавлена в services:', service.subServices.length);
                }
                if (state.currentService?.id === serviceId) {
                    if (!state.currentService.subServices) {
                        state.currentService.subServices = [];
                    }
                    state.currentService.subServices.push({ ...subService, variants: subService.variants || [] });
                    console.log('Комплектация добавлена в currentService:', state.currentService.subServices.length);
                }
            })
            .addCase(updateSubServiceInService, (state, action) => {
                const { serviceId, subService } = action.payload;
                const service = state.services.find(s => s.id === serviceId);
                if (service && service.subServices) {
                    const index = service.subServices.findIndex(ss => ss.id === subService.id);
                    if (index !== -1) {
                        service.subServices[index] = { ...subService, variants: subService.variants || [] };
                    }
                }
                if (state.currentService?.id === serviceId && state.currentService.subServices) {
                    const index = state.currentService.subServices.findIndex(ss => ss.id === subService.id);
                    if (index !== -1) {
                        state.currentService.subServices[index] = { ...subService, variants: subService.variants || [] };
                    }
                }
            })
            .addCase(removeSubServiceFromService, (state, action) => {
                const { serviceId, subServiceId } = action.payload;
                const service = state.services.find(s => s.id === serviceId);
                if (service && service.subServices) {
                    service.subServices = service.subServices.filter(ss => ss.id !== subServiceId);
                }
                if (state.currentService?.id === serviceId && state.currentService.subServices) {
                    state.currentService.subServices = state.currentService.subServices.filter(ss => ss.id !== subServiceId);
                }
            })
            .addCase(updateSubServiceOrder.fulfilled, () => {
                // Обновляем порядок в services после успешного сохранения
                // Порядок будет обновлен при следующей загрузке данных
            });
    },
});

export const {
    clearError,
    setCurrentService,
    clearCurrentService
} = servicesSlice.actions;
export default servicesSlice.reducer; 