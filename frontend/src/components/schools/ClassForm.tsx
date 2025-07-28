/**
 * @file: ClassForm.tsx
 * @description: Форма для создания классов в школе
 * @dependencies: react, react-redux, @mui/material, react-hook-form
 * @created: 2024-07-07
 */

import React from 'react';
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
import { createClass } from '../../store/schoolsSlice';
import type { RootState, AppDispatch } from '../../store';
import type { CreateClassData } from '../../store/schoolsSlice';

interface ClassFormProps {
    schoolId: number;
    onCancel: () => void;
    onSuccess: () => void;
}

const ClassForm: React.FC<ClassFormProps> = ({
    schoolId,
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
    } = useForm<CreateClassData>({
        defaultValues: {
            name: '',
            shift: '',
            teacher: '',
            phone: '',
            note: '',
            schoolId,
        },
    });

    const onSubmit = async (data: CreateClassData) => {
        try {
            await dispatch(createClass(data)).unwrap();
            reset();
            onSuccess();
        } catch (error) {
            console.error('Ошибка создания класса:', error);
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
                    Создание класса
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
                                        required: 'Название класса обязательно',
                                        minLength: {
                                            value: 1,
                                            message: 'Название должно содержать минимум 1 символ',
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Название класса"
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
                                    name="shift"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Смена"
                                            fullWidth
                                            placeholder="1 или 2"
                                            error={!!errors.shift}
                                            helperText={errors.shift?.message}
                                            disabled={isLoading}
                                        />
                                    )}
                                />
                            </Box>

                            <Box>
                                <Controller
                                    name="teacher"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Преподаватель"
                                            fullWidth
                                            error={!!errors.teacher}
                                            helperText={errors.teacher?.message}
                                            disabled={isLoading}
                                        />
                                    )}
                                />
                            </Box>

                            <Box>
                                <Controller
                                    name="phone"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Телефон"
                                            fullWidth
                                            placeholder="+7 (999) 123-45-67"
                                            error={!!errors.phone}
                                            helperText={errors.phone?.message}
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
                                    Создать
                                </Button>
                            </Box>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ClassForm; 