/**
 * @file: ServiceForm.tsx
 * @description: Форма для создания и редактирования услуг
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
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { createService, updateService, clearError } from '../../store/servicesSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Service, CreateServiceData, UpdateServiceData } from '../../store/servicesSlice';

interface ServiceFormProps {
    service?: Service;
    onCancel: () => void;
    onSuccess: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
    service,
    onCancel,
    onSuccess,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error } = useSelector((state: RootState) => state.services);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateServiceData>({
        defaultValues: {
            name: '',
            description: '',
            isActive: true,
        },
    });

    useEffect(() => {
        if (service) {
            reset({
                name: service.name,
                description: service.description || '',
                isActive: service.isActive,
            });
        }
    }, [service, reset]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const onSubmit = async (data: CreateServiceData) => {
        try {
            if (service) {
                const updateData: UpdateServiceData = {
                    id: service.id,
                    ...data,
                };
                await dispatch(updateService(updateData)).unwrap();
            } else {
                await dispatch(createService(data)).unwrap();
            }
            onSuccess();
        } catch (error) {
            console.error('Ошибка сохранения услуги:', error);
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
                    {service ? 'Редактирование услуги' : 'Создание услуги'}
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
                                            label="Название услуги"
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
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Описание"
                                            fullWidth
                                            multiline
                                            rows={4}
                                            error={!!errors.description}
                                            helperText={errors.description?.message}
                                            disabled={isLoading}
                                        />
                                    )}
                                />
                            </Box>

                            <Box>
                                <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            }
                                            label="Активна"
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
                                    {service ? 'Сохранить' : 'Создать'}
                                </Button>
                            </Box>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ServiceForm; 