/**
 * @file: ClassForm.tsx
 * @description: Форма для создания классов в школе
 * @dependencies: react, react-redux, @mui/material, react-hook-form
 * @created: 2024-07-07
 */

import React from 'react';
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
import { createSchool, clearError } from '../../store/schoolsSlice';
import type { RootState, AppDispatch } from '../../store';

interface ClassFormProps {
    schoolId: number;
    onSuccess: () => void;
    onCancel: () => void;
}

interface ClassFormData {
    name: string;
    schoolId: number;
}

const ClassForm: React.FC<ClassFormProps> = ({ schoolId, onSuccess, onCancel }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error } = useSelector((state: RootState) => state.schools);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ClassFormData>({
        defaultValues: {
            name: '',
            schoolId: schoolId,
        },
    });

    const onSubmit = async (data: ClassFormData) => {
        try {
            await dispatch(createSchool(data)).unwrap();
            reset();
            onSuccess();
        } catch (error) {
            console.error('Ошибка создания класса:', error);
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
                Создать класс
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
                        {isLoading ? 'Создание...' : 'Создать класс'}
                    </Button>
                    <Button variant="outlined" onClick={handleCancel}>
                        Отмена
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default ClassForm; 