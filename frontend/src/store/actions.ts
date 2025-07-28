/**
 * @file: actions.ts
 * @description: Общие действия для синхронизации между слайсами
 * @dependencies: @reduxjs/toolkit
 * @created: 2024-07-08
 */

import { createAction } from '@reduxjs/toolkit';
import type { SubService } from './subServicesSlice';

// Действия для синхронизации комплектаций с услугами
export const addSubServiceToService = createAction<{
    serviceId: number;
    subService: SubService
}>('services/addSubServiceToService');

export const updateSubServiceInService = createAction<{
    serviceId: number;
    subService: SubService
}>('services/updateSubServiceInService');

export const removeSubServiceFromService = createAction<{
    serviceId: number;
    subServiceId: number
}>('services/removeSubServiceFromService'); 