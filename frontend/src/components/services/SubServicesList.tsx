/**
 * @file: SubServicesList.tsx
 * @description: Компонент для отображения списка комплектации
 * @dependencies: react, react-redux, @mui/material
 * @created: 2024-07-07
 */

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Avatar,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { fetchSubServices, fetchSubServicesByService, deleteSubService } from '../../store/subServicesSlice';
import type { RootState, AppDispatch } from '../../store';
import type { SubService } from '../../store/subServicesSlice';

interface SubServicesListProps {
    serviceId?: number;
    onViewSubService: (subService: SubService) => void;
    onEditSubService: (subService: SubService) => void;
    onCreateSubService: () => void;
}

const SubServicesList: React.FC<SubServicesListProps> = ({
    serviceId,
    onViewSubService,
    onEditSubService,
    onCreateSubService,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { subServices, isLoading, error } = useSelector((state: RootState) => state.subServices);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (serviceId) {
            // Загружаем комплектацию конкретной услуги
            dispatch(fetchSubServicesByService(serviceId));
        } else {
            // Загружаем всю комплектацию
            dispatch(fetchSubServices());
        }
    }, [dispatch, serviceId]);

    const handleDeleteSubService = async (subServiceId: number) => {
        if (window.confirm('Вы уверены, что хотите удалить эту комплектацию?')) {
            try {
                await dispatch(deleteSubService(subServiceId)).unwrap();
            } catch (error) {
                console.error('Ошибка удаления комплектации:', error);
            }
        }
    };

            const canManageSubServices = user && user.role === 'ADMIN';

    // Сортировка комплектации по названию
    const sortedSubServices = useMemo(() => {
        return [...subServices].sort((a, b) => a.name.localeCompare(b.name));
    }, [subServices]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Комплектация
                </Typography>
                {canManageSubServices && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onCreateSubService}
                    >
                        Добавить комплектацию
                    </Button>
                )}
            </Box>

            {sortedSubServices.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography variant="body1" color="text.secondary" textAlign="center">
                            Комплектация не найдена
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>№</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Аватар</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Название</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Описание</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Цена</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Мин. возраст</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Услуга</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedSubServices.map((subService, index) => (
                                <TableRow
                                    key={subService.id}
                                    hover
                                    onClick={() => onViewSubService(subService)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {index + 1}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {subService.avatar ? (
                                            <Avatar
                                                src={subService.avatar}
                                                alt={subService.name}
                                                sx={{ width: 40, height: 40 }}
                                            />
                                        ) : (
                                            <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}>
                                                {subService.name.charAt(0)}
                                            </Avatar>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {subService.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ whiteSpace: 'pre-line' }}
                                        >
                                            {subService.description || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="medium">
                                            {subService.price.toLocaleString('ru-RU')} ₽
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {subService.minAge}+
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {subService.service?.name || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={subService.isActive ? 'Активна' : 'Неактивна'}
                                            color={subService.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                        <IconButton
                                            size="small"
                                            onClick={() => onViewSubService(subService)}
                                            title="Просмотр"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                        {canManageSubServices && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onEditSubService(subService)}
                                                    title="Редактировать"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteSubService(subService.id)}
                                                    title="Удалить"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default SubServicesList; 