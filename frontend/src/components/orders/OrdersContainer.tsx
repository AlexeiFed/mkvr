/**
 * @file: OrdersContainer.tsx
 * @description: Основной контейнер для управления заказами
 * @dependencies: react, react-redux
 * @created: 2024-07-06
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import OrdersList from './OrdersList';
import OrderForm from './OrderForm';
import OrderDetails from './OrderDetails';
import type { RootState } from '../../store';
import type { Order } from '../../types';

type ViewMode = 'list' | 'create' | 'edit' | 'details';

const OrdersContainer: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const { user } = useSelector((state: RootState) => state.auth);

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setViewMode('details');
    };

    const handleEditOrder = (order: Order) => {
        setSelectedOrder(order);
        setViewMode('edit');
    };

    const handleCreateOrder = () => {
        setSelectedOrder(null);
        setViewMode('create');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedOrder(null);
    };

    const handleFormSuccess = () => {
        setViewMode('list');
        setSelectedOrder(null);
    };

    const handleFormCancel = () => {
        if (selectedOrder) {
            setViewMode('details');
        } else {
            setViewMode('list');
        }
    };

    // Проверка прав доступа
            const canCreateOrder = user && (user.role === 'ADMIN' || user.role === 'PARENT');

    switch (viewMode) {
        case 'create':
            return (
                <OrderForm
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            );

        case 'edit':
            return selectedOrder ? (
                <OrderForm
                    order={selectedOrder}
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                <OrdersList
                    onViewOrder={handleViewOrder}
                    onEditOrder={handleEditOrder}
                    onCreateOrder={handleCreateOrder}
                />
            );

        case 'details':
            return selectedOrder ? (
                <OrderDetails
                    order={selectedOrder}
                    onBack={handleBackToList}
                    onEdit={() => handleEditOrder(selectedOrder)}
                />
            ) : (
                <OrdersList
                    onViewOrder={handleViewOrder}
                    onEditOrder={handleEditOrder}
                    onCreateOrder={handleCreateOrder}
                />
            );

        default:
            return (
                <OrdersList
                    onViewOrder={handleViewOrder}
                    onEditOrder={handleEditOrder}
                    onCreateOrder={canCreateOrder ? handleCreateOrder : () => { }}
                />
            );
    }
};

export default OrdersContainer; 