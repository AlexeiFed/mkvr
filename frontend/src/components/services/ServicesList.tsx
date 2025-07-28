/**
 * @file: ServicesList.tsx
 * @description: Компонент для отображения списка услуг
 * @dependencies: react, react-redux, @mui/material
 * @created: 2024-07-06
 */

import React, { useEffect } from 'react';
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
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { fetchServices, deleteService } from '../../store/servicesSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Service } from '../../store/servicesSlice';

interface ServicesListProps {
    onViewService: (service: Service) => void;
    onEditService: (service: Service) => void;
    onCreateService: () => void;
}

const ServicesList: React.FC<ServicesListProps> = ({
    onViewService,
    onEditService,
    onCreateService,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { services, isLoading, error } = useSelector((state: RootState) => state.services);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(fetchServices());
    }, [dispatch]);

    const handleDeleteService = async (serviceId: number) => {
        if (window.confirm('Вы уверены, что хотите удалить эту услугу?')) {
            try {
                await dispatch(deleteService(serviceId)).unwrap();
            } catch (error) {
                console.error('Ошибка удаления услуги:', error);
            }
        }
    };

    const canManageServices = user && user.role === 'admin';

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
                    Услуги
                </Typography>
                {canManageServices && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onCreateService}
                    >
                        Добавить услугу
                    </Button>
                )}
            </Box>

            {services.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography variant="body1" color="text.secondary" textAlign="center">
                            Услуги не найдены
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Название</TableCell>
                                <TableCell>Описание</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {services.map((service) => (
                                <TableRow
                                    key={service.id}
                                    hover
                                    onClick={() => onViewService(service)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {service.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {service.description || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={service.isActive ? 'Активна' : 'Неактивна'}
                                            color={service.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                        <IconButton
                                            size="small"
                                            onClick={() => onViewService(service)}
                                            title="Просмотр"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                        {canManageServices && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onEditService(service)}
                                                    title="Редактировать"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteService(service.id)}
                                                >
                                                    Удалить
                                                </Button>
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

export default ServicesList; 