/**
 * @file: ServicesContainer.tsx
 * @description: Основной контейнер для управления услугами
 * @dependencies: react, react-redux
 * @created: 2024-07-06
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ServicesList from './ServicesList';
import ServiceForm from './ServiceForm';
import ServiceDetails from './ServiceDetails';
import ComplectationForm from './ComplectationForm';
import type { RootState } from '../../store';
import type { Service } from '../../store/servicesSlice';
import type { SubService } from '../../store/subServicesSlice';

type ViewMode = 'list' | 'create' | 'edit' | 'details' | 'createSubService' | 'editSubService';

const ServicesContainer: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedSubService, setSelectedSubService] = useState<SubService | null>(null);
    const { user } = useSelector((state: RootState) => state.auth);
    const { services } = useSelector((state: RootState) => state.services);

    // Синхронизируем selectedService с актуальными данными из Redux store
    useEffect(() => {
        if (selectedService) {
            const updatedService = services.find(s => s.id === selectedService.id);
            if (updatedService) {
                console.log('Обновляем selectedService:', updatedService);
                console.log('Количество комплектаций:', updatedService.subServices?.length || 0);
                setSelectedService(updatedService);
            }
        }
    }, [services, selectedService?.id]);

    const handleViewService = (service: Service) => {
        setSelectedService(service);
        setViewMode('details');
    };

    const handleEditService = (service: Service) => {
        setSelectedService(service);
        setViewMode('edit');
    };

    const handleCreateService = () => {
        setSelectedService(null);
        setViewMode('create');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedService(null);
    };

    const handleFormSuccess = () => {
        setViewMode('list');
        setSelectedService(null);
    };

    const handleFormCancel = () => {
        if (selectedService) {
            setViewMode('details');
        } else {
            setViewMode('list');
        }
    };

    const handleAddSubService = () => {
        setViewMode('createSubService');
    };

    const handleComplectationSuccess = () => {
        // Теперь состояние синхронизируется автоматически через Redux
        // Не нужно делать дополнительный запрос
        setViewMode('details');
    };

    const handleEditComplectation = (subService: SubService) => {
        setSelectedSubService(subService);
        setViewMode('editSubService');
    };

    // Проверка прав доступа - только администраторы могут управлять услугами
            const canManageServices = user && user.role === 'ADMIN';

    switch (viewMode) {
        case 'create':
            return canManageServices ? (
                <ServiceForm
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                <ServicesList
                    onViewService={handleViewService}
                    onEditService={handleEditService}
                    onCreateService={handleCreateService}
                />
            );

        case 'edit':
            return selectedService && canManageServices ? (
                <ServiceForm
                    service={selectedService}
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                <ServicesList
                    onViewService={handleViewService}
                    onEditService={handleEditService}
                    onCreateService={handleCreateService}
                />
            );

        case 'details':
            return selectedService ? (
                <ServiceDetails
                    service={selectedService}
                    onBack={handleBackToList}
                    onEdit={canManageServices ? () => handleEditService(selectedService) : undefined}
                    onAddSubService={canManageServices ? handleAddSubService : undefined}
                    onEditComplectation={canManageServices ? (subService: SubService) => handleEditComplectation(subService) : undefined}
                />
            ) : (
                <ServicesList
                    onViewService={handleViewService}
                    onEditService={handleEditService}
                    onCreateService={handleCreateService}
                />
            );

        case 'createSubService':
            return selectedService ? (
                <ComplectationForm
                    serviceId={selectedService.id}
                    onCancel={() => setViewMode('details')}
                    onSuccess={handleComplectationSuccess}
                />
            ) : (
                <ServicesList
                    onViewService={handleViewService}
                    onEditService={handleEditService}
                    onCreateService={handleCreateService}
                />
            );

        case 'editSubService':
            return selectedService && selectedSubService ? (
                <ComplectationForm
                    subService={selectedSubService}
                    serviceId={selectedService.id}
                    onCancel={() => setViewMode('details')}
                    onSuccess={handleComplectationSuccess}
                />
            ) : (
                <ServicesList
                    onViewService={handleViewService}
                    onEditService={handleEditService}
                    onCreateService={handleCreateService}
                />
            );

        default:
            return (
                <ServicesList
                    onViewService={handleViewService}
                    onEditService={canManageServices ? handleEditService : () => { }}
                    onCreateService={canManageServices ? handleCreateService : () => { }}
                />
            );
    }
};

export default ServicesContainer; 