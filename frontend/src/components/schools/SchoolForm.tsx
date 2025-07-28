/**
 * @file: SchoolForm.tsx
 * @description: Форма для создания и редактирования школ
 * @dependencies: react, react-redux, @mui/material, react-hook-form
 * @created: 2024-07-06
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { createSchool, updateSchool, clearError } from '../../store/schoolsSlice';
import type { RootState, AppDispatch } from '../../store';
import type { School, CreateSchoolData, UpdateSchoolData } from '../../store/schoolsSlice';

interface SchoolFormProps {
    school?: School;
    onCancel: () => void;
    onSuccess: () => void;
}

const SchoolForm: React.FC<SchoolFormProps> = ({
    school,
    onCancel,
    onSuccess,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error } = useSelector((state: RootState) => state.schools);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateSchoolData>({
        defaultValues: {
            name: '',
            address: '',
            note: '',
        },
    });

    useEffect(() => {
        if (school) {
            reset({
                name: school.name,
                address: school.address,
                note: school.note || '',
            });
        }
    }, [school, reset]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const onSubmit = async (data: CreateSchoolData) => {
        try {
            if (school) {
                const updateData: UpdateSchoolData = {
                    id: school.id,
                    ...data,
                };
                await dispatch(updateSchool(updateData)).unwrap();
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
                    startIcon={<ArrowBackIcon />}
                    onClick={onCancel}
                    sx={{ mr: 2 }}
                >
                    Назад
                </Button>
                <Typography variant="h4" component="h1">
                    {school ? 'Редактирование школы' : 'Создание школы'}
                </Typography>
            </Box>

            <Card>
                <CardContent>
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
                                        required: 'Название обязательно',
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
                                        required: 'Адрес обязателен',
                                        minLength: {
                                            value: 5,
                                            message: 'Адрес должен содержать минимум 5 символов',
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Адрес"
                                            fullWidth
                                            error={!!errors.address}
                                            helperText={errors.address?.message}
                                            disabled={isLoading}
                                        />
                                    )}
                                />
                            </Box>

                            <Box>
                                <Controller
                                    name="note"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Примечание"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            error={!!errors.note}
                                            helperText={errors.note?.message}
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
                </CardContent>
            </Card>
        </Box>
    );
};

export default SchoolForm; 