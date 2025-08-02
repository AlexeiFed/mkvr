/**
 * @file: SchoolForm.tsx
 * @description: Форма для создания и редактирования школ
 * @dependencies: react, react-redux, @mui/material, react-hook-form
 * @created: 2024-07-06
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { createSchool, updateSchool, clearError } from '../../store/schoolsSlice';
import type { School } from '../../store/schoolsSlice';
import type { RootState, AppDispatch } from '../../store';

interface SchoolFormProps {
    school?: School;
    onSuccess: () => void;
    onCancel: () => void;
}

const SchoolForm: React.FC<SchoolFormProps> = ({ school, onSuccess, onCancel }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error } = useSelector((state: RootState) => state.schools);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<Partial<School>>({
        defaultValues: {
            name: '',
            address: '',
            isActive: true,
        },
    });

    useEffect(() => {
        if (school) {
            reset({
                name: school.name,
                address: school.address,
                isActive: school.isActive,
            });
        }
    }, [school, reset]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const onSubmit = async (data: Partial<School>) => {
        try {
            if (school) {
                await dispatch(updateSchool({ id: school.id, data })).unwrap();
            } else {
                await dispatch(createSchool(data)).unwrap();
            }
            onSuccess();
        } catch (error) {
            console.error('Ошибка сохранения школы:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    onClick={onCancel}
                    sx={{ mr: 2 }}
                >
                    Назад
                </Button>
                <Typography variant="h4" component="h1">
                    {school ? 'Редактирование школы' : 'Создание школы'}
                </Typography>
            </Box>

            <Box>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <Box>
                            <Controller
                                name="name"
                                control={control}
                                rules={{
                                    required: 'Название школы обязательно',
                                    minLength: {
                                        value: 2,
                                        message: 'Название должно содержать минимум 2 символа',
                                    },
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Название школы"
                                        fullWidth
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                        disabled={isLoading}
                                    />
                                )}
                            />
                        </Box>

                        <Box>
                            <Controller
                                name="address"
                                control={control}
                                rules={{
                                    required: 'Адрес школы обязателен',
                                    minLength: {
                                        value: 5,
                                        message: 'Адрес должен содержать минимум 5 символов',
                                    },
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Адрес школы"
                                        fullWidth
                                        error={!!errors.address}
                                        helperText={errors.address?.message}
                                        disabled={isLoading}
                                    />
                                )}
                            />
                        </Box>

                        <Box display="flex" gap={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                onClick={onCancel}
                                disabled={isLoading}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isLoading}
                                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                            >
                                {school ? 'Сохранить' : 'Создать'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Box>
        </Box>
    );
};

export default SchoolForm; 