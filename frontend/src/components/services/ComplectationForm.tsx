/**
 * @file: ComplectationForm.tsx
 * @description: Форма для создания и редактирования комплектации
 * @dependencies: react, react-redux, @mui/material, react-hook-form
 * @created: 2024-07-07
 */

import React, { useEffect, useState } from 'react';
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
    Switch,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { createSubService, updateSubService, clearError } from '../../store/subServicesSlice';
import { addSubServiceToService, updateSubServiceInService } from '../../store/actions';
import FileUpload from '../common/FileUpload';
import { uploadPhotosToServer } from '../../utils/fileUpload';
import type { RootState, AppDispatch } from '../../store';
import type { SubService, CreateSubServiceData, CreateSubServiceVariantData } from '../../store/subServicesSlice';

interface ComplectationFormProps {
    subService?: SubService;
    serviceId?: number;
    onCancel: () => void;
    onSuccess: () => void;
}

const ComplectationForm: React.FC<ComplectationFormProps> = ({
    subService,
    serviceId,
    onCancel,
    onSuccess,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.subServices);

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm<CreateSubServiceData>({
        defaultValues: {
            name: subService?.name || '',
            serviceId: serviceId || subService?.serviceId || 0,
            minAge: subService?.minAge || 0,
            hasVariants: subService?.variants && subService.variants.length > 0,
            price: subService?.price || 0,
            variants: subService?.variants || []
        }
    });

    // Сброс формы при изменении subService
    useEffect(() => {
        if (subService) {
            reset({
                name: subService.name,
                serviceId: subService.serviceId,
                minAge: subService.minAge,
                hasVariants: subService.variants && subService.variants.length > 0,
                price: subService.price,
                variants: subService.variants
            });
        } else {
            reset({
                name: '',
                serviceId: serviceId || 0,
                minAge: 0,
                hasVariants: false,
                price: 0,
                variants: []
            });
        }
    }, [subService, serviceId, reset]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const onSubmit = async (data: CreateSubServiceData) => {
        try {
            setIsUploading(true);

            // Отправляем только url (строки), не File
            const submitData: CreateSubServiceData = {
                ...data,
                serviceId: serviceId || data.serviceId,
                minAge: Number(data.minAge),
                hasVariants: data.hasVariants,
                price: Number(data.price) || 0, // Добавляем поле price
                variants: data.variants || []
            };

            if (subService) {
                const result = await dispatch(updateSubService({ ...submitData, id: subService.id }));
                if (result.payload) {
                    // Синхронизируем с servicesSlice
                    dispatch(updateSubServiceInService({
                        serviceId: serviceId || data.serviceId,
                        subService: result.payload.subService
                    }));
                }
            } else {
                const result = await dispatch(createSubService(submitData));
                if (result.payload) {
                    // Синхронизируем с servicesSlice
                    dispatch(addSubServiceToService({
                        serviceId: serviceId || data.serviceId,
                        subService: result.payload.subService
                    }));
                } else {
                    console.error('Не удалось получить payload из результата создания');
                }
            }

            // Убираем задержку и сразу вызываем onSuccess
            onSuccess();
        } catch (error) {
            console.error('Ошибка сохранения комплектации:', error);
            // Показываем более подробную информацию об ошибке
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Не удалось сохранить комплектацию.');
            }
        } finally {
            setIsUploading(false);
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
                    {subService ? 'Редактирование комплектации' : 'Создание комплектации'}
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
                                            label="Название комплектации"
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
                                    name="minAge"
                                    control={control}
                                    rules={{
                                        required: 'Минимальный возраст обязателен',
                                        min: {
                                            value: 0,
                                            message: 'Возраст не может быть отрицательным',
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Минимальный возраст"
                                            type="number"
                                            fullWidth
                                            error={!!errors.minAge}
                                            helperText={errors.minAge?.message}
                                            disabled={isLoading}
                                        />
                                    )}
                                />
                            </Box>

                            <Box>
                                <Controller
                                    name="hasVariants"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.value}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.checked);
                                                        // Если включаем варианты и их нет, добавляем первый
                                                        if (e.target.checked) {
                                                            const currentVariants = watch('variants') || [];
                                                            if (currentVariants.length === 0) {
                                                                const newVariant: CreateSubServiceVariantData = {
                                                                    name: '',
                                                                    price: 0,
                                                                    media: [],
                                                                    videos: [],
                                                                    isActive: true
                                                                };
                                                                setValue('variants', [newVariant]);
                                                            }
                                                        }
                                                    }}
                                                    disabled={isLoading}
                                                />
                                            }
                                            label="Есть варианты комплектации"
                                        />
                                    )}
                                />
                            </Box>

                            {/* Поле цены отображается только если нет вариантов */}
                            {!watch('hasVariants') && (
                                <Box>
                                    <Controller
                                        name="price"
                                        control={control}
                                        rules={{
                                            required: 'Цена обязательна',
                                            min: {
                                                value: 0,
                                                message: 'Цена не может быть отрицательной',
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Цена (₽)"
                                                type="number"
                                                fullWidth
                                                error={!!errors.price}
                                                helperText={errors.price?.message}
                                                disabled={isLoading}
                                            />
                                        )}
                                    />
                                </Box>
                            )}

                            <Controller
                                name="variants"
                                control={control}
                                render={({ field }) => {
                                    const hasVariants = watch('hasVariants');
                                    return (
                                        <Accordion expanded={hasVariants} disabled={!hasVariants || isLoading}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle1">
                                                    Варианты комплектации ({field.value?.length || 0})
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    {field.value?.map((variant, index) => (
                                                        <Card key={index} sx={{ p: 2 }}>
                                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                    <TextField
                                                                        label="Название варианта"
                                                                        value={variant.name}
                                                                        onChange={(e) => {
                                                                            const newVariants = [...(field.value || [])];
                                                                            newVariants[index] = { ...variant, name: e.target.value };
                                                                            field.onChange(newVariants);
                                                                        }}
                                                                        fullWidth
                                                                    />
                                                                    <TextField
                                                                        label="Цена (₽)"
                                                                        type="number"
                                                                        value={variant.price}
                                                                        onChange={(e) => {
                                                                            const newVariants = [...(field.value || [])];
                                                                            newVariants[index] = { ...variant, price: Number(e.target.value) };
                                                                            field.onChange(newVariants);
                                                                        }}
                                                                        fullWidth
                                                                    />
                                                                    <FormControlLabel
                                                                        control={
                                                                            <Switch
                                                                                checked={variant.isActive}
                                                                                onChange={(e) => {
                                                                                    const newVariants = [...(field.value || [])];
                                                                                    newVariants[index] = { ...variant, isActive: e.target.checked };
                                                                                    field.onChange(newVariants);
                                                                                }}
                                                                            />
                                                                        }
                                                                        label="Активный вариант"
                                                                    />
                                                                    <Box>
                                                                        <Typography variant="subtitle2" gutterBottom>
                                                                            Медиа файлы
                                                                        </Typography>
                                                                        <FileUpload
                                                                            accept="image/*"
                                                                            multiple={true}
                                                                            maxFiles={10}
                                                                            maxSize={5 * 1024 * 1024} // 5MB
                                                                            label="Загрузить изображения"
                                                                            onChange={async (urls) => {
                                                                                const newVariants = [...(field.value || [])];
                                                                                newVariants[index] = { ...variant, media: urls };
                                                                                field.onChange(newVariants);
                                                                            }}
                                                                            onFilesChange={async (files) => {
                                                                                if (files.length > 0) {
                                                                                    try {
                                                                                        setIsUploading(true);
                                                                                        const token = localStorage.getItem('token');
                                                                                        if (!token) throw new Error('Токен не найден');

                                                                                        const urls = await uploadPhotosToServer(files, `${import.meta.env.VITE_API_URL}/upload/photos`, token);
                                                                                        const newVariants = [...(field.value || [])];
                                                                                        const existingPhotos = variant.media || [];
                                                                                        newVariants[index] = { ...variant, media: [...existingPhotos, ...urls] };
                                                                                        field.onChange(newVariants);
                                                                                    } catch (error) {
                                                                                        console.error('Ошибка загрузки фото:', error);
                                                                                        setError('Ошибка загрузки фото');
                                                                                    } finally {
                                                                                        setIsUploading(false);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            disabled={isLoading || isUploading}
                                                                            isLoading={isUploading}
                                                                            hidePreview={true}
                                                                        />
                                                                        {variant.media && variant.media.length > 0 && (
                                                                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                                {variant.media.map((photo, photoIndex) => (
                                                                                    <Box key={photoIndex} sx={{ position: 'relative' }}>
                                                                                        <img
                                                                                            src={photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_URL.replace('/api', '')}${photo}`}
                                                                                            alt={`Фото ${photoIndex + 1}`}
                                                                                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                                                                                        />
                                                                                        <Button
                                                                                            variant="contained"
                                                                                            color="error"
                                                                                            size="small"
                                                                                            onClick={() => {
                                                                                                const newVariants = [...(field.value || [])];
                                                                                                const newPhotos = [...(variant.media || [])];
                                                                                                newPhotos.splice(photoIndex, 1);
                                                                                                newVariants[index] = { ...variant, media: newPhotos };
                                                                                                field.onChange(newVariants);
                                                                                            }}
                                                                                            sx={{ position: 'absolute', top: 0, right: 0, minWidth: 0, width: 20, height: 20, fontSize: '12px' }}
                                                                                        >
                                                                                            ×
                                                                                        </Button>
                                                                                    </Box>
                                                                                ))}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography variant="subtitle2" gutterBottom>
                                                                            Видео файлы
                                                                        </Typography>
                                                                        <FileUpload
                                                                            accept="video/*"
                                                                            multiple={true}
                                                                            maxFiles={5}
                                                                            maxSize={50 * 1024 * 1024} // 50MB
                                                                            label="Загрузить видео"
                                                                            onChange={async (urls) => {
                                                                                const newVariants = [...(field.value || [])];
                                                                                newVariants[index] = { ...variant, videos: urls };
                                                                                field.onChange(newVariants);
                                                                            }}
                                                                            onFilesChange={async (files) => {
                                                                                if (files.length > 0) {
                                                                                    try {
                                                                                        setIsUploading(true);
                                                                                        const token = localStorage.getItem('token');
                                                                                        if (!token) throw new Error('Токен не найден');

                                                                                        const urls = await uploadPhotosToServer(files, `${import.meta.env.VITE_API_URL}/upload/videos`, token);
                                                                                        const newVariants = [...(field.value || [])];
                                                                                        const existingVideos = variant.videos || [];
                                                                                        newVariants[index] = { ...variant, videos: [...existingVideos, ...urls] };
                                                                                        field.onChange(newVariants);
                                                                                    } catch (error) {
                                                                                        console.error('Ошибка загрузки видео:', error);
                                                                                        setError('Ошибка загрузки видео');
                                                                                    } finally {
                                                                                        setIsUploading(false);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            disabled={isLoading || isUploading}
                                                                            isLoading={isUploading}
                                                                            hidePreview={true}
                                                                        />
                                                                        {variant.videos && variant.videos.length > 0 && (
                                                                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                                {variant.videos.map((video, videoIndex) => (
                                                                                    <Box key={videoIndex} sx={{ position: 'relative' }}>
                                                                                        <video
                                                                                            src={video.startsWith('http') ? video : `${import.meta.env.VITE_API_URL.replace('/api', '')}${video}`}
                                                                                            style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                                                                            controls
                                                                                        />
                                                                                        <Button
                                                                                            variant="contained"
                                                                                            color="error"
                                                                                            size="small"
                                                                                            onClick={() => {
                                                                                                const newVariants = [...(field.value || [])];
                                                                                                const newVideos = [...(variant.videos || [])];
                                                                                                newVideos.splice(videoIndex, 1);
                                                                                                newVariants[index] = { ...variant, videos: newVideos };
                                                                                                field.onChange(newVariants);
                                                                                            }}
                                                                                            sx={{ position: 'absolute', top: 0, right: 0, minWidth: 0, width: 20, height: 20, fontSize: '12px' }}
                                                                                        >
                                                                                            ×
                                                                                        </Button>
                                                                                    </Box>
                                                                                ))}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                                <IconButton
                                                                    color="error"
                                                                    onClick={() => {
                                                                        const newVariants = (field.value || []).filter((_, i) => i !== index);
                                                                        field.onChange(newVariants);
                                                                    }}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Box>
                                                        </Card>
                                                    ))}
                                                    <Button
                                                        startIcon={<AddIcon />}
                                                        onClick={() => {
                                                            const newVariant: CreateSubServiceVariantData = {
                                                                name: '',
                                                                price: 0,
                                                                media: [],
                                                                videos: [],
                                                                isActive: true
                                                            };
                                                            field.onChange([...(field.value || []), newVariant]);
                                                        }}
                                                        variant="outlined"
                                                    >
                                                        Добавить вариант
                                                    </Button>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                }}
                            />

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    onClick={onCancel}
                                    disabled={isLoading || isUploading}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isLoading || isUploading}
                                    startIcon={isLoading || isUploading ? <CircularProgress size={20} /> : null}
                                >
                                    {subService ? 'Обновить' : 'Создать'}
                                </Button>
                            </Box>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ComplectationForm; 