/**
 * @file: store/index.ts
 * @description: Конфигурация Redux store
 * @dependencies: @reduxjs/toolkit, react-redux
 * @created: 2024-07-06
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ordersReducer from './ordersSlice';
import servicesReducer from './servicesSlice';
import subServicesReducer from './subServicesSlice';
import schoolsReducer from './schoolsSlice';
import classesReducer from './classesSlice';
import shiftsReducer from './shiftsSlice';
import workshopsReducer from './workshopsSlice';
import usersReducer from './usersSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        orders: ordersReducer,
        services: servicesReducer,
        subServices: subServicesReducer,
        schools: schoolsReducer,
        classes: classesReducer,
        shifts: shiftsReducer,
        workshops: workshopsReducer,
        users: usersReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 