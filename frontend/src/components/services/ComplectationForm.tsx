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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { createSubService, updateSubService, clearError } from '../../store/subServicesSlice';
import { fetchServices } from '../../store/servicesSlice';
import { addSubServiceToService, updateSubServiceInService } from '../../store/actions';
import FileUpload from '../common/FileUpload';
import { uploadFileToServer, uploadPhotosToServer } from '../../utils/fileUpload';
import type { RootState, AppDispatch } from '../../store';
import type { SubService, CreateSubServiceData, CreateSubServiceVariantData } from '../../store/subServicesSlice';

interface ComplectationFormProps {
    subService?: SubService;
    serviceId?: number;
    onCancel: () => void;
    onSuccess: () => void;
}

// Функция для получения корректного URL для предпросмотра
const getMediaUrl = (media: File | string | undefined | null): string | undefined => {
    if (!media) return undefined;
    if (media instanceof File) return URL.createObjectURL(media);
    if (typeof media === 'string') {
        if (media.startsWith('/uploads/')) {
            return `http://localhost:3001${media}`;
        }
        return media;
    }
    return undefined;
};

const ComplectationForm: React.FC<ComplectationFormProps> = ({
    subService,
    serviceId,
    onCancel,
    onSuccess,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.subServices);
    const { services } = useSelector((state: RootState) => state.services);
    const { token } = useSelector((state: RootState) => state.auth);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [allPhotos, setAllPhotos] = useState<(File | string)[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // При инициализации формы (useEffect) объединяем subService?.photos и photoFiles
    useEffect(() => {
        if (subService) {
            setAllPhotos([...(subService.photos || [])]);
        } else {
            setAllPhotos([]);
        }
    }, [subService]);



    // При удалении фото
    const handleRemovePhoto = (index: number) => {
        setAllPhotos(prev => prev.filter((_, i) => i !== index));
    };



    // Удаляем cropper и связанные состояния/функции

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
        watch,
    } = useForm<CreateSubServiceData>({
        defaultValues: {
            name: '',
            description: '',
            avatar: '',
            photos: [],
            video: '',
            serviceId: serviceId || 0,
            minAge: 0,
            hasVariants: false,
            price: 0, // Добавляем поле price
            variants: []
        },
    });

    useEffect(() => {
        // Загружаем список услуг для выбора
        dispatch(fetchServices());
    }, [dispatch]);

    useEffect(() => {
        if (subService) {
            reset({
                name: subService.name,
                description: subService.description || '',
                avatar: subService.avatar || '',
                photos: subService.photos || [],
                video: subService.video || '',
                serviceId: subService.serviceId,
                minAge: subService.minAge ?? 0,
                hasVariants: subService.hasVariants,
                price: subService.price || 0, // Добавляем поле price
                variants: subService.variants || []
            });
        } else if (serviceId) {
            reset({
                name: '',
                description: '',
                avatar: '',
                photos: [],
                video: '',
                serviceId: serviceId,
                minAge: 0,
                hasVariants: false,
                price: 0, // Добавляем поле price
                variants: []
            });
        }
    }, [subService, serviceId, reset]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    // Удаляем handleImageSelect, handleCropComplete, handleCropCancel, handlePhotoEdit

    const onSubmit = async (data: CreateSubServiceData) => {
        try {
            setIsUploading(true);

            // Загружаем файлы на сервер
            let avatarUrl = data.avatar || '';
            let photoUrls: string[] = [];
            let videoUrl = data.video || '';

            if (avatarFile && token) {
                try {
                    avatarUrl = await uploadFileToServer(avatarFile, 'http://localhost:3001/api/upload/avatar', token);
                } catch (error) {
                    console.error('Ошибка загрузки аватарки:', error);
                }
            }

            // В onSubmit:
            // 1. Фильтруем File и string отдельно
            // 2. Загружаем только новые File, объединяем с url
            // 3. Отправляем только актуальный массив
            const newFiles = allPhotos.filter(f => f instanceof File) as File[];
            const oldUrls = allPhotos.filter(f => typeof f === 'string') as string[];

            if (newFiles.length > 0 && token) {
                const uploadedUrls = await uploadPhotosToServer(newFiles, 'http://localhost:3001/api/upload/photo', token);
                photoUrls = [...oldUrls, ...uploadedUrls];
            } else {
                photoUrls = oldUrls;
            }

            // Фильтрация массива фото (убираем дубликаты и пустые)
            photoUrls = Array.from(new Set(photoUrls)).filter(Boolean);

            if (videoFile && token) {
                try {
                    videoUrl = await uploadFileToServer(videoFile, 'http://localhost:3001/api/upload/video', token);
                } catch (error) {
                    console.error('Ошибка загрузки видео:', error);
                }
            }

            // Отправляем только url (строки), не File
            const submitData: CreateSubServiceData = {
                ...data,
                avatar: avatarUrl,
                photos: photoUrls,
                video: videoUrl,
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
                                                                    description: '',
                                                                    price: 0,
                                                                    order: 0,
                                                                    photos: [],
                                                                    videos: []
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
                                                                        label="Описание"
                                                                        value={variant.description || ''}
                                                                        onChange={(e) => {
                                                                            const newVariants = [...(field.value || [])];
                                                                            newVariants[index] = { ...variant, description: e.target.value };
                                                                            field.onChange(newVariants);
                                                                        }}
                                                                        fullWidth
                                                                        multiline
                                                                        rows={2}
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

                                                                    {/* Медиа поля для варианта */}
                                                                    <Box>
                                                                        <Typography variant="subtitle2" gutterBottom>
                                                                            Аватарка варианта
                                                                        </Typography>
                                                                        <FileUpload
                                                                            accept="image/*"
                                                                            multiple={false}
                                                                            maxFiles={1}
                                                                            maxSize={10 * 1024 * 1024}
                                                                            label="Загрузить аватарку"
                                                                            onChange={async (urls) => {
                                                                                const newVariants = [...(field.value || [])];
                                                                                newVariants[index] = { ...variant, avatar: urls[0] };
                                                                                field.onChange(newVariants);
                                                                            }}
                                                                            onFilesChange={async (files) => {
                                                                                if (files.length > 0) {
                                                                                    try {
                                                                                        setIsUploading(true);
                                                                                        const token = localStorage.getItem('token');
                                                                                        if (!token) throw new Error('Токен не найден');

                                                                                        const url = await uploadFileToServer(files[0], 'http://localhost:3001/api/upload/avatar', token);
                                                                                        const newVariants = [...(field.value || [])];
                                                                                        newVariants[index] = { ...variant, avatar: url };
                                                                                        field.onChange(newVariants);
                                                                                    } catch (error) {
                                                                                        console.error('Ошибка загрузки аватарки:', error);
                                                                                        setError('Ошибка загрузки аватарки');
                                                                                    } finally {
                                                                                        setIsUploading(false);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            disabled={isLoading || isUploading}
                                                                            isLoading={isUploading}
                                                                        />
                                                                        {variant.avatar && (
                                                                            <Box sx={{ mt: 1 }}>
                                                                                <img
                                                                                    src={variant.avatar.startsWith('http') ? variant.avatar : `http://localhost:3001${variant.avatar}`}
                                                                                    alt="Аватарка варианта"
                                                                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                                                                                    onError={(e) => {
                                                                                        e.currentTarget.src = '/no-image.png';
                                                                                    }}
                                                                                />
                                                                            </Box>
                                                                        )}
                                                                    </Box>

                                                                    <Box>
                                                                        <Typography variant="subtitle2" gutterBottom>
                                                                            Фотографии варианта
                                                                        </Typography>
                                                                        <FileUpload
                                                                            accept="image/*"
                                                                            multiple={true}
                                                                            maxFiles={10}
                                                                            maxSize={10 * 1024 * 1024}
                                                                            label="Загрузить фотографии"
                                                                            onChange={async (urls) => {
                                                                                const newVariants = [...(field.value || [])];
                                                                                newVariants[index] = { ...variant, photos: urls };
                                                                                field.onChange(newVariants);
                                                                            }}
                                                                            onFilesChange={async (files) => {
                                                                                if (files.length > 0) {
                                                                                    try {
                                                                                        setIsUploading(true);
                                                                                        const token = localStorage.getItem('token');
                                                                                        if (!token) throw new Error('Токен не найден');

                                                                                        const urls = await uploadPhotosToServer(files, 'http://localhost:3001/api/upload/photos', token);
                                                                                        const newVariants = [...(field.value || [])];
                                                                                        const existingPhotos = variant.photos || [];
                                                                                        newVariants[index] = { ...variant, photos: [...existingPhotos, ...urls] };
                                                                                        field.onChange(newVariants);
                                                                                    } catch (error) {
                                                                                        console.error('Ошибка загрузки фотографий:', error);
                                                                                        setError('Ошибка загрузки фотографий');
                                                                                    } finally {
                                                                                        setIsUploading(false);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            disabled={isLoading || isUploading}
                                                                            isLoading={isUploading}
                                                                            hidePreview={true}
                                                                        />
                                                                        {variant.photos && variant.photos.length > 0 && (
                                                                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                                {variant.photos.map((photo, photoIndex) => (
                                                                                    <Box key={photoIndex} sx={{ position: 'relative' }}>
                                                                                        <img
                                                                                            src={photo.startsWith('http') ? photo : `http://localhost:3001${photo}`}
                                                                                            alt={`Фото ${photoIndex + 1}`}
                                                                                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                                                                                            onError={(e) => {
                                                                                                e.currentTarget.src = '/no-image.png';
                                                                                            }}
                                                                                        />
                                                                                        <Button
                                                                                            size="small"
                                                                                            color="error"
                                                                                            onClick={() => {
                                                                                                const newVariants = [...(field.value || [])];
                                                                                                const newPhotos = [...(variant.photos || [])];
                                                                                                newPhotos.splice(photoIndex, 1);
                                                                                                newVariants[index] = { ...variant, photos: newPhotos };
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
                                                                            Видео варианта
                                                                        </Typography>
                                                                        <FileUpload
                                                                            accept="video/*"
                                                                            multiple={true}
                                                                            maxFiles={5}
                                                                            maxSize={50 * 1024 * 1024}
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

                                                                                        // Загружаем каждое видео отдельно
                                                                                        const urls = [];
                                                                                        for (const file of files) {
                                                                                            const url = await uploadFileToServer(file, 'http://localhost:3001/api/upload/video', token);
                                                                                            urls.push(url);
                                                                                        }

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
                                                                                            src={video.startsWith('http') ? video : `http://localhost:3001${video}`}
                                                                                            controls
                                                                                            style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                                                                            onError={(e) => {
                                                                                                e.currentTarget.poster = '/no-image.png';
                                                                                            }}
                                                                                        />
                                                                                        <Button
                                                                                            size="small"
                                                                                            color="error"
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
                                                                description: '',
                                                                price: 0,
                                                                order: 0,
                                                                photos: [],
                                                                videos: []
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

                            {/* Медиа файлы отображаются только если нет вариантов */}
                            {!watch('hasVariants') && (
                                <>
                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Аватарка
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                            Максимальный размер файла: 10MB
                                        </Typography>

                                        <FileUpload
                                            accept="image/*"
                                            multiple={false}
                                            maxFiles={1}
                                            maxSize={10 * 1024 * 1024} // 10MB
                                            label="Загрузить аватарку"
                                            onChange={(urls) => {
                                                // Обработка URL после загрузки на сервер
                                                console.log('Avatar URLs:', urls);
                                            }}
                                            onFilesChange={async (files) => {
                                                console.log('Avatar files selected:', files);
                                                if (files[0]) {
                                                    try {
                                                        setIsUploading(true);
                                                        const token = localStorage.getItem('token');
                                                        if (!token) throw new Error('Токен не найден');

                                                        const url = await uploadFileToServer(files[0], 'http://localhost:3001/api/upload/avatar', token);
                                                        setAvatarFile(files[0]);
                                                        // Обновляем значение в форме
                                                        setValue('avatar', url);
                                                    } catch (error) {
                                                        console.error('Ошибка загрузки аватарки:', error);
                                                        setError('Ошибка загрузки аватарки');
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                } else {
                                                    setAvatarFile(null);
                                                }
                                            }}
                                            disabled={isLoading || isUploading}
                                            isLoading={isUploading}
                                        />

                                        {/* Существующая аватарка */}
                                        {(avatarFile || subService?.avatar) && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Аватарка:
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box
                                                        component="img"
                                                        src={getMediaUrl(avatarFile || subService?.avatar)}
                                                        alt="Аватарка"
                                                        sx={{
                                                            width: 80,
                                                            height: 80,
                                                            objectFit: 'cover',
                                                            borderRadius: 1,
                                                            border: '1px solid #ddd',
                                                        }}
                                                    />
                                                    {!avatarFile && subService?.avatar && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            (Нельзя редактировать)
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Фотографии
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                            До 10 файлов, максимальный размер каждого файла: 10MB
                                        </Typography>
                                        <FileUpload
                                            accept="image/*"
                                            multiple={true}
                                            maxFiles={10}
                                            maxSize={10 * 1024 * 1024} // 10MB
                                            label="Загрузить фотографии"
                                            onChange={(urls) => {
                                                // Обработка URL после загрузки на сервер
                                                console.log('Photo URLs:', urls);
                                            }}
                                            onFilesChange={async (files) => {
                                                console.log('Photo files selected:', files);
                                                if (files.length > 0) {
                                                    try {
                                                        setIsUploading(true);
                                                        const token = localStorage.getItem('token');
                                                        if (!token) throw new Error('Токен не найден');

                                                        const urls = await uploadPhotosToServer(files, 'http://localhost:3001/api/upload/photos', token);
                                                        const existingUrls = allPhotos.filter(f => typeof f === 'string') as string[];
                                                        setAllPhotos([...existingUrls, ...urls]);
                                                        // Обновляем значение в форме
                                                        setValue('photos', [...existingUrls, ...urls]);
                                                    } catch (error) {
                                                        console.error('Ошибка загрузки фотографий:', error);
                                                        setError('Ошибка загрузки фотографий');
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }
                                            }}
                                            disabled={isLoading || isUploading}
                                            isLoading={isUploading}
                                            hidePreview={true}
                                        />
                                        {/* Предпросмотр всех фото (File и url) */}
                                        {((allPhotos && allPhotos.length > 0) || (subService?.photos && subService.photos.length > 0)) && (
                                            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                {(allPhotos.length > 0 ? allPhotos : (subService?.photos || [])).map((photo, idx) => (
                                                    <Box key={idx} sx={{ position: 'relative' }}>
                                                        <img
                                                            src={getMediaUrl(photo)}
                                                            alt={`Фото ${idx + 1}`}
                                                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                                                        />
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemovePhoto(idx)}
                                                            sx={{ position: 'absolute', top: 0, right: 0, minWidth: 0, width: 24, height: 24 }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Видео */}
                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Видео
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                            Максимальный размер файла: 50MB
                                        </Typography>
                                        <FileUpload
                                            accept="video/*"
                                            multiple={false}
                                            maxFiles={1}
                                            maxSize={50 * 1024 * 1024} // 50MB
                                            label="Загрузить видео"
                                            onChange={(urls) => {
                                                // Обработка URL после загрузки на сервер
                                                console.log('Video URLs:', urls);
                                            }}
                                            onFilesChange={async (files) => {
                                                console.log('Video files selected:', files);
                                                if (files[0]) {
                                                    try {
                                                        setIsUploading(true);
                                                        const token = localStorage.getItem('token');
                                                        if (!token) throw new Error('Токен не найден');

                                                        const url = await uploadFileToServer(files[0], 'http://localhost:3001/api/upload/video', token);
                                                        setVideoFile(files[0]);
                                                        // Обновляем значение в форме
                                                        setValue('video', url);
                                                    } catch (error) {
                                                        console.error('Ошибка загрузки видео:', error);
                                                        setError('Ошибка загрузки видео');
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                } else {
                                                    setVideoFile(null);
                                                }
                                            }}
                                            disabled={isLoading || isUploading}
                                            isLoading={isUploading}
                                            hidePreview={true}
                                        />
                                        {/* Универсальный предпросмотр видео */}
                                        {(videoFile || subService?.video) && (
                                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #eee', borderRadius: 2, p: 1, maxWidth: 400 }}>
                                                <a href={getMediaUrl(videoFile || subService?.video)} target="_blank" rel="noopener noreferrer">
                                                    <video
                                                        src={getMediaUrl(videoFile || subService?.video)}
                                                        controls
                                                        style={{ width: 320, height: 180, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd', background: '#000' }}
                                                    />
                                                </a>
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        {videoFile ? videoFile.name : 'Существующее видео'}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setVideoFile(null)}
                                                        sx={{ minWidth: 0, width: 24, height: 24 }}
                                                    >
                                                        ×
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </>
                            )}

                            {!serviceId && (
                                <Box>
                                    <Controller
                                        name="serviceId"
                                        control={control}
                                        rules={{
                                            required: 'Выберите услугу',
                                        }}
                                        render={({ field }) => (
                                            <FormControl fullWidth error={!!errors.serviceId}>
                                                <InputLabel>Услуга</InputLabel>
                                                <Select
                                                    {...field}
                                                    label="Услуга"
                                                    disabled={isLoading}
                                                >
                                                    {services.map((service) => (
                                                        <MenuItem key={service.id} value={service.id}>
                                                            {service.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Box>
                            )}

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
                                    {subService ? 'Сохранить' : 'Создать'}
                                </Button>
                            </Box>
                        </Box>
                    </form>
                </CardContent>
            </Card>

            {/* Компонент для обрезки изображений */}
            {/* Удаляем ImageCropper */}
        </Box>
    );
};

export default ComplectationForm; 