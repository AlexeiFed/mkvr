/**
 * @file: WorkshopFilters.tsx
 * @description: Компонент фильтров для мастер-классов
 * @dependencies: React, MUI, Redux
 * @created: 2024-12-19
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchSchoolClasses } from '../../store/schoolsSlice';
import {
    Box,
    FormControl,
    TextField,
    IconButton,
    Tooltip
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Clear as ClearIcon } from '@mui/icons-material';
import type { RootState } from '../../store';
import type { AppDispatch } from '../../store';

interface WorkshopFiltersProps {
    filters: {
        date: string | null;
        schoolId: string | null;
        classId: string | null;
        serviceId: string | null;
    };
    onFilterChange: (filters: Partial<{
        date: string | null;
        schoolId: string | null;
        classId: string | null;
        serviceId: string | null;
    }>) => void;
}

const WorkshopFilters: React.FC<WorkshopFiltersProps> = ({ filters, onFilterChange }) => {
    const { schools } = useSelector((state: RootState) => state.schools);
    const { services } = useSelector((state: RootState) => state.services);
    const dispatch = useDispatch<AppDispatch>();
    const { classes } = useSelector((state: RootState) => state.schools);

    // Подгружаем классы при изменении фильтра "Школа"
    useEffect(() => {
        if (filters.schoolId) {
            dispatch(fetchSchoolClasses(Number(filters.schoolId)));
        }
    }, [dispatch, filters.schoolId]);

    // Сортировка классов по алфавиту с учетом числовых значений
    const sortedClasses = [...(classes || [])].sort((a, b) => {
        const numA = parseInt(a.name);
        const numB = parseInt(b.name);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        return a.name.localeCompare(b.name, 'ru');
    });

    const handleClearFilters = () => {
        onFilterChange({
            date: null,
            schoolId: null,
            classId: null,
            serviceId: null,
        });
    };

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, alignItems: 'center' }}>
            <TextField
                fullWidth
                type="date"
                label="Дата"
                value={filters.date || ''}
                onChange={(e) => onFilterChange({ date: e.target.value || null })}
                InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
                <Autocomplete
                    options={schools}
                    getOptionLabel={(option) => option.name || ''}
                    value={schools.find(s => String(s.id) === String(filters.schoolId)) || null}
                    onChange={(_, value) => onFilterChange({ schoolId: value ? String(value.id) : null, classId: null })}
                    renderInput={(params) => (
                        <TextField {...params} label="Школа" fullWidth />
                    )}
                    isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                />
            </FormControl>

            <FormControl fullWidth>
                <Autocomplete
                    options={filters.schoolId ? sortedClasses : []}
                    getOptionLabel={(option) => option.name || ''}
                    value={classes.find(c => String(c.id) === String(filters.classId)) || null}
                    onChange={(_, value) => onFilterChange({ classId: value ? String(value.id) : null })}
                    renderInput={(params) => (
                        <TextField {...params} label="Класс" fullWidth />
                    )}
                    isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                    disabled={!filters.schoolId}
                />
            </FormControl>

            <FormControl fullWidth>
                <Autocomplete
                    options={services}
                    getOptionLabel={(option) => option.name || ''}
                    value={services.find(s => String(s.id) === String(filters.serviceId)) || null}
                    onChange={(_, value) => onFilterChange({ serviceId: value ? String(value.id) : null })}
                    renderInput={(params) => (
                        <TextField {...params} label="Услуга" fullWidth />
                    )}
                    isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                />
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Очистить фильтры">
                    <IconButton onClick={handleClearFilters} color="secondary">
                        <ClearIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
};

export default WorkshopFilters; 