/**
 * @file: ClassEditForm.tsx
 * @description: Форма для редактирования классов в школе
 * @dependencies: react, react-redux, @mui/material, react-hook-form
 * @created: 2024-07-07
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { clearError } from '../../store/schoolsSlice';
import type { Class } from '../../store/schoolsSlice';
import type { RootState, AppDispatch } from '../../store';

interface ClassEditFormProps {
    classItem: Class;
    onSuccess: () => void;
    onCancel: () => void;
}

interface ClassEditFormData {
    name: string;
    schoolId: number;
}

const ClassEditForm: React.FC<ClassEditFormProps> = ({ classItem, onSuccess, onCancel }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error } = useSelector((state: RootState) => state.schools);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ClassEditFormData>({
        defaultValues: {
            name: classItem.name,
            schoolId: classItem.schoolId,
        },
    });

    useEffect(() => {
        reset({
            name: classItem.name,
            schoolId: classItem.schoolId,
        });
    }, [classItem, reset]);

    const onSubmit = async (data: ClassEditFormData) => {
        try {
            // TODO: Реализовать обновление класса
            console.log('Обновление класса:', data);
            onSuccess();
        } catch (error) {
            console.error('Ошибка обновления класса:', error);
        }
    };

    const handleCancel = () => {
        dispatch(clearError());
        reset();
        onCancel();
    };

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" component="h2" gutterBottom>
                Редактировать класс
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ mb: 2 }}>
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: 'Название класса обязательно' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Название класса"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                            />
                        )}
                    />
                </Box>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : null}
                    >
                        {isLoading ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                    <Button variant="outlined" onClick={handleCancel}>
                        Отмена
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default ClassEditForm; 