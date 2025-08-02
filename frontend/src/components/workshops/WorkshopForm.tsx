/**
 * @file: WorkshopForm.tsx
 * @description: Форма для добавления и редактирования мастер-классов
 * @dependencies: React, MUI, Redux
 * @created: 2024-12-19
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import {
    Box,
    TextField,
    FormControl,
    Button,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import type { RootState } from '../../store';
import { createWorkshop, updateWorkshop } from '../../store/workshopsSlice';
import { fetchSchools } from '../../store/schoolsSlice';
import { fetchServices } from '../../store/servicesSlice';
import type { WorkshopCreateData } from '../../store/workshopsSlice';
import type { Workshop } from '../../types';

interface WorkshopFormProps {
    selectedDate?: Date | null;
    editWorkshop?: Workshop | null;
    onClose: () => void;
    onSuccess: () => void;
}

const WorkshopForm: React.FC<WorkshopFormProps> = ({
    selectedDate,
    editWorkshop,
    onClose,
    onSuccess
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { schools } = useSelector((state: RootState) => state.schools);
    const { services } = useSelector((state: RootState) => state.services);
    const { classes } = useSelector((state: RootState) => state.schools);

    const [formData, setFormData] = useState({
        schoolId: '',
        classId: '',
        serviceId: '',
        date: selectedDate ? selectedDate.toLocaleDateString('en-CA') : '',
        time: '',
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (editWorkshop) {
            setFormData({
                schoolId: editWorkshop.schoolId ? String(editWorkshop.schoolId) : '',
                classId: editWorkshop.classId ? String(editWorkshop.classId) : '',
                serviceId: editWorkshop.serviceId ? String(editWorkshop.serviceId) : '',
                date: editWorkshop.date ? new Date(editWorkshop.date).toLocaleDateString('en-CA') : '',
                time: editWorkshop.time || '',
                notes: editWorkshop.notes || ''
            });
        } else if (selectedDate) {
            setFormData(prev => ({
                ...prev,
                date: selectedDate.toLocaleDateString('en-CA')
            }));
        }
    }, [editWorkshop, selectedDate]);

    // Подгружаем услуги при монтировании, если их нет
    useEffect(() => {
        if (!services || services.length === 0) {
            dispatch(fetchServices());
        }
    }, [dispatch, services]);

    // Подгружаем классы при выборе школы
    useEffect(() => {
        if (formData.schoolId) {
            dispatch(fetchSchools());
        }
    }, [dispatch, formData.schoolId]);

    // Сортировка классов по алфавиту с учетом числовых значений
    const sortedClasses = [...(classes || [])].sort((a, b) => {
        // Если оба названия начинаются с числа, сравниваем как числа
        const numA = parseInt(a.name);
        const numB = parseInt(b.name);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        // Если только одно из названий начинается с числа, оно идёт первым
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        // Иначе обычная сортировка строк
        return a.name.localeCompare(b.name, 'ru');
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.schoolId) newErrors.schoolId = 'Выберите школу';
        if (!formData.classId) newErrors.classId = 'Выберите класс';
        if (!formData.serviceId) newErrors.serviceId = 'Выберите услугу';
        if (!formData.date) newErrors.date = 'Выберите дату';
        if (!formData.time) newErrors.time = 'Выберите время';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (editWorkshop) {
                await dispatch(updateWorkshop({ id: String(editWorkshop.id), data: formData }));
            } else {
                await dispatch(createWorkshop(formData as WorkshopCreateData));
            }
            onSuccess();
        } catch (error) {
            console.error('Ошибка сохранения мастер-класса:', error);
        }
    };

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <DialogTitle>{editWorkshop ? 'Редактировать мастер-класс' : 'Добавить мастер-класс'}</DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
                    <FormControl fullWidth error={!!errors.schoolId}>
                        <Autocomplete
                            options={schools}
                            getOptionLabel={(option) => option.name || ''}
                            value={schools.find(s => String(s.id) === String(formData.schoolId)) || null}
                            onChange={(_, value) => handleChange('schoolId', value ? String(value.id) : '')}
                            renderInput={(params) => (
                                <TextField {...params} label="Школа" error={!!errors.schoolId} helperText={errors.schoolId} fullWidth />
                            )}
                            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                        />
                    </FormControl>

                    <FormControl fullWidth error={!!errors.classId}>
                        <Autocomplete
                            options={formData.schoolId ? sortedClasses : []}
                            getOptionLabel={(option) => option.name || ''}
                            value={classes.find(c => String(c.id) === String(formData.classId)) || null}
                            onChange={(_, value) => handleChange('classId', value ? String(value.id) : '')}
                            renderInput={(params) => (
                                <TextField {...params} label="Класс" error={!!errors.classId} helperText={errors.classId} fullWidth />
                            )}
                            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                            disabled={!formData.schoolId}
                        />
                    </FormControl>

                    <FormControl fullWidth error={!!errors.serviceId}>
                        <Autocomplete
                            options={services}
                            getOptionLabel={(option) => option.name || ''}
                            value={services.find(s => String(s.id) === String(formData.serviceId)) || null}
                            onChange={(_, value) => handleChange('serviceId', value ? String(value.id) : '')}
                            renderInput={(params) => (
                                <TextField {...params} label="Услуга" error={!!errors.serviceId} helperText={errors.serviceId} fullWidth />
                            )}
                            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                        />
                    </FormControl>

                    <TextField
                        fullWidth
                        type="date"
                        label="Дата"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        error={!!errors.date}
                        helperText={errors.date}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth
                        type="time"
                        label="Время"
                        value={formData.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                        error={!!errors.time}
                        helperText={errors.time}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Примечания"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button type="submit" variant="contained">
                    {editWorkshop ? 'Сохранить изменения' : 'Создать мастер-класс'}
                </Button>
            </DialogActions>
        </Box>
    );
};

export default WorkshopForm; 