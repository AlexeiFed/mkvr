/**
 * @file: SchoolsContainer.tsx
 * @description: Основной контейнер для управления школами
 * @dependencies: react, react-redux
 * @created: 2024-07-06
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import SchoolsList from './SchoolsList';
import SchoolForm from './SchoolForm';
import SchoolDetails from './SchoolDetails';
import type { RootState } from '../../store';
import type { School } from '../../store/schoolsSlice';

type ViewMode = 'list' | 'create' | 'edit' | 'details';

const SchoolsContainer: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const { user } = useSelector((state: RootState) => state.auth);

    const handleViewSchool = (school: School) => {
        setSelectedSchool(school);
        setViewMode('details');
    };

    const handleEditSchool = (school: School) => {
        setSelectedSchool(school);
        setViewMode('edit');
    };

    const handleCreateSchool = () => {
        setSelectedSchool(null);
        setViewMode('create');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedSchool(null);
    };

    const handleFormSuccess = () => {
        setViewMode('list');
        setSelectedSchool(null);
    };

    const handleFormCancel = () => {
        if (selectedSchool) {
            setViewMode('details');
        } else {
            setViewMode('list');
        }
    };

    // Проверка прав доступа - только администраторы могут управлять школами
            const canManageSchools = user && user.role === 'ADMIN';

    switch (viewMode) {
        case 'create':
            return canManageSchools ? (
                <SchoolForm
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                <SchoolsList
                    onViewSchool={handleViewSchool}
                    onEditSchool={handleEditSchool}
                    onCreateSchool={handleCreateSchool}
                />
            );

        case 'edit':
            return selectedSchool && canManageSchools ? (
                <SchoolForm
                    school={selectedSchool}
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                <SchoolsList
                    onViewSchool={handleViewSchool}
                    onEditSchool={handleEditSchool}
                    onCreateSchool={handleCreateSchool}
                />
            );

        case 'details':
            return selectedSchool ? (
                <SchoolDetails
                    schoolId={selectedSchool.id}
                    onBack={handleBackToList}
                    onEdit={canManageSchools ? () => handleEditSchool(selectedSchool) : undefined}
                />
            ) : (
                <SchoolsList
                    onViewSchool={handleViewSchool}
                    onEditSchool={handleEditSchool}
                    onCreateSchool={handleCreateSchool}
                />
            );

        default:
            return (
                <SchoolsList
                    onViewSchool={handleViewSchool}
                    onEditSchool={canManageSchools ? handleEditSchool : () => { }}
                    onCreateSchool={canManageSchools ? handleCreateSchool : () => { }}
                />
            );
    }
};

export default SchoolsContainer; 