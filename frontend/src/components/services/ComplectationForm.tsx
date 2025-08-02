/**
 * @file: ComplectationForm.tsx
 * @description: Форма создания и редактирования комплектаций с поддержкой медиа файлов
 * @dependencies: React, MUI, react-hook-form, FileUpload
 * @created: 2025-01-12
 */

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    TextField,
    Switch,
    FormControlLabel,
    CircularProgress,
    Alert
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import FileUpload from '../common/FileUpload';
import { uploadFileToServer, uploadPhotosToServer } from '../../utils/fileUpload';
import type { SubService } from '../../store/subServicesSlice';

interface ComplectationFormProps {
    subService?: SubService;
    serviceId?: number;
    services: Array<{ id: number; name: string }>;
    onCancel: () => void;
    onSuccess: () => void;
}

interface CreateSubServiceData {
    name: string;
    description?: string;
    avatar?: string;
    photos?: string[];
    video?: string;
    serviceId: number;
    minAge: number;
    price?: number;
    variants?: CreateSubServiceVariantData[];
}

interface CreateSubServiceVariantData {
    name: string;
    description?: string;
    price: number;
    avatar?: string;
    photos: string[];
    video?: string;
    order: number;
    isActive: boolean;
}

const ComplectationForm: React.FC<ComplectationFormProps> = ({
    subService,
    serviceId,
    onCancel,
    onSuccess
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [allPhotos, setAllPhotos] = useState<(File | string)[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const defaultValues = {
        name: subService?.name || '',
        description: subService?.description || '',
        avatar: subService?.avatar || '',
        photos: subService?.photos || [],
        video: subService?.video || '',
        serviceId: serviceId || subService?.serviceId || 0,
        minAge: subService?.minAge || 0,
        price: subService?.price || 0,
        variants: subService?.variants || []
    };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors }
    } = useForm<CreateSubServiceData>({
        defaultValues
    });

    const watchedVariants = watch('variants');

    useEffect(() => {
        if (subService) {
            reset({
                name: subService.name,
                description: subService.description,
                avatar: subService.avatar,
                photos: subService.photos,
                video: subService.video,
                serviceId: subService.serviceId,
                minAge: subService.minAge,
                price: subService.price,
                variants: subService.variants
            });
        }
    }, [subService, reset]);

    const onSubmit = async (data: CreateSubServiceData) => {
        try {
            setIsUploading(true);
            setError(null);

            // Загружаем файлы на сервер
            let avatarUrl = data.avatar || '';
            let photoUrls: string[] = [];
            let videoUrl = data.video || '';

            if (avatarFile && token) {
                try {
                    avatarUrl = await uploadFileToServer(avatarFile, `${import.meta.env.VITE_API_URL}/upload/avatar`, token);
                } catch (error) {
                    console.error('Ошибка загрузки аватарки:', error);
                }
            }

            // Загружаем фотографии
            const newFiles = allPhotos.filter(f => f instanceof File) as File[];
            const oldUrls = allPhotos.filter(f => typeof f === 'string') as string[];
            if (newFiles.length > 0 && token) {
                const uploadedUrls = await uploadPhotosToServer(newFiles, `${import.meta.env.VITE_API_URL}/upload/photos`, token);
                photoUrls = [...oldUrls, ...uploadedUrls];
            } else {
                photoUrls = oldUrls;
            }

            // Загружаем видео
            if (videoFile && token) {
                try {
                    videoUrl = await uploadFileToServer(videoFile, `${import.meta.env.VITE_API_URL}/upload/video`, token);
                } catch (error) {
                    console.error('Ошибка загрузки видео:', error);
                }
            }

            const submitData: CreateSubServiceData = {
                ...data,
                avatar: avatarUrl,
                photos: photoUrls,
                video: videoUrl,
                serviceId: serviceId || data.serviceId,
                minAge: Number(data.minAge),
                price: Number(data.price) || 0,
                variants: data.variants || []
            };

            if (subService) {
                // Обновление
                const response = await fetch(`${import.meta.env.VITE_API_URL}/subServices/${subService.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(submitData)
                });

                if (!response.ok) {
                    throw new Error('Ошибка обновления комплектации');
                }
            } else {
                // Создание
                const response = await fetch(`${import.meta.env.VITE_API_URL}/subServices`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(submitData)
                });

                if (!response.ok) {
                    throw new Error('Ошибка создания комплектации');
                }
            }

            onSuccess();
        } catch (error) {
            console.error('Ошибка:', error);
            setError(error instanceof Error ? error.message : 'Произошла ошибка');
        } finally {
            setIsUploading(false);
        }
    };

    const token = localStorage.getItem('token');

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    {subService ? 'Редактировать комплектацию' : 'Создать комплектацию'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: 'Название обязательно' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Название комплектации"
                                fullWidth
                                margin="normal"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                            />
                        )}
                    />

                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Описание"
                                fullWidth
                                margin="normal"
                                multiline
                                rows={3}
                            />
                        )}
                    />

                    <Controller
                        name="minAge"
                        control={control}
                        rules={{ required: 'Минимальный возраст обязателен' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Минимальный возраст"
                                type="number"
                                fullWidth
                                margin="normal"
                                error={!!errors.minAge}
                                helperText={errors.minAge?.message}
                            />
                        )}
                    />

                    <Controller
                        name="price"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Цена (₽)"
                                type="number"
                                fullWidth
                                margin="normal"
                            />
                        )}
                    />

                    {/* Медиа файлы для основной комплектации */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Медиа файлы
                        </Typography>

                        {/* Аватар */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Аватар
                            </Typography>
                            <FileUpload
                                accept="image/*"
                                multiple={false}
                                maxFiles={1}
                                maxSize={10 * 1024 * 1024}
                                label="Загрузить аватар"
                                onChange={() => { }}
                                onFilesChange={(files) => {
                                    if (files.length > 0) {
                                        setAvatarFile(files[0]);
                                    }
                                }}
                                disabled={isUploading}
                                isLoading={isUploading}
                            />
                        </Box>

                        {/* Фотографии */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Фотографии
                            </Typography>
                            <FileUpload
                                accept="image/*"
                                multiple={true}
                                maxFiles={10}
                                maxSize={10 * 1024 * 1024}
                                label="Загрузить фотографии"
                                onChange={() => { }}
                                onFilesChange={(files) => {
                                    setAllPhotos(prev => [...prev, ...files]);
                                }}
                                disabled={isUploading}
                                isLoading={isUploading}
                            />
                        </Box>

                        {/* Видео */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Видео
                            </Typography>
                            <FileUpload
                                accept="video/*"
                                multiple={false}
                                maxFiles={1}
                                maxSize={50 * 1024 * 1024}
                                label="Загрузить видео"
                                onChange={() => { }}
                                onFilesChange={(files) => {
                                    if (files.length > 0) {
                                        setVideoFile(files[0]);
                                    }
                                }}
                                disabled={isUploading}
                                isLoading={isUploading}
                            />
                        </Box>
                    </Box>

                    {/* Варианты */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Варианты комплектации
                        </Typography>

                        {watchedVariants?.map((_, index) => (
                            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Вариант {index + 1}
                                </Typography>

                                <Controller
                                    name={`variants.${index}.name`}
                                    control={control}
                                    rules={{ required: 'Название варианта обязательно' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Название варианта"
                                            fullWidth
                                            margin="normal"
                                        />
                                    )}
                                />

                                <Controller
                                    name={`variants.${index}.description`}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Описание варианта"
                                            fullWidth
                                            margin="normal"
                                            multiline
                                            rows={2}
                                        />
                                    )}
                                />

                                <Controller
                                    name={`variants.${index}.price`}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Цена варианта (₽)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                        />
                                    )}
                                />

                                <Controller
                                    name={`variants.${index}.isActive`}
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                />
                                            }
                                            label="Активный вариант"
                                        />
                                    )}
                                />
                            </Box>
                        ))}

                        <Button
                            variant="outlined"
                            onClick={() => {
                                const newVariant: CreateSubServiceVariantData = {
                                    name: '',
                                    description: '',
                                    price: 0,
                                    avatar: '',
                                    photos: [],
                                    video: '',
                                    order: 0,
                                    isActive: true
                                };
                                setValue('variants', [...(watchedVariants || []), newVariant]);
                            }}
                            sx={{ mt: 1 }}
                        >
                            Добавить вариант
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={onCancel}
                            disabled={isUploading}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isUploading}
                            startIcon={isUploading ? <CircularProgress size={20} /> : null}
                        >
                            {subService ? 'Обновить' : 'Создать'}
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ComplectationForm; 