/**
 * @file: WorkshopsList.tsx
 * @description: Компонент списка мастер-классов
 * @dependencies: React, MUI, types
 * @created: 2024-12-19
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Box
} from '@mui/material';
import { Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import type { Workshop } from '../../types';

interface WorkshopsListProps {
    workshops: Workshop[];
    loading: boolean;
    onEdit: (workshop: Workshop) => void;
    onDelete: (id: number) => void;
    onAssignExecutors: (workshop: Workshop) => void;
}

const WorkshopsList: React.FC<WorkshopsListProps> = ({ workshops, loading, onEdit, onDelete, onAssignExecutors }) => {
    const navigate = useNavigate();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'primary';
            case 'in-progress': return 'warning';
            case 'completed': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'scheduled': return 'Запланирован';
            case 'in-progress': return 'В процессе';
            case 'completed': return 'Завершен';
            case 'cancelled': return 'Отменен';
            default: return status;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (workshops.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Мастер-классы не найдены
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Дата</TableCell>
                            <TableCell>Время</TableCell>
                            <TableCell>Школа</TableCell>
                            <TableCell>Класс</TableCell>
                            <TableCell>Услуга</TableCell>
                            <TableCell>Записано детей</TableCell>
                            <TableCell>Оплатили</TableCell>
                            <TableCell>Исполнители</TableCell>
                            <TableCell>Статус</TableCell>
                            <TableCell>Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {workshops.map((workshop) => (
                            <TableRow key={workshop.id}>
                                <TableCell>
                                    {new Date(workshop.date).toLocaleDateString('ru-RU')}
                                </TableCell>
                                <TableCell>
                                    {workshop.time}
                                </TableCell>
                                <TableCell>{workshop.school?.name || 'Не указана'}</TableCell>
                                <TableCell>{workshop.class?.name || 'Не указан'}</TableCell>
                                <TableCell>{workshop.service?.name || workshop.notes || 'Не указана'}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">
                                        {workshop.totalParticipants || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        из {workshop.maxParticipants}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">
                                        {workshop.paidParticipants || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {workshop.paidAmount || 0} ₽
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {workshop.executors && workshop.executors.length > 0 ? (
                                            workshop.executors.slice(0, 2).map((executorItem) => {
                                                const executor = executorItem.executor || executorItem;
                                                return (
                                                    <Chip
                                                        key={executor.id}
                                                        label={`${executor.firstName} ${executor.lastName}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                );
                                            })
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Не назначены
                                            </Typography>
                                        )}
                                        {workshop.executors && workshop.executors.length > 2 && (
                                            <Chip
                                                label={`+${workshop.executors.length - 2}`}
                                                size="small"
                                                color="primary"
                                            />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={getStatusText(workshop.status)}
                                        color={getStatusColor(workshop.status) as 'primary' | 'warning' | 'success' | 'error' | 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="Просмотр">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => navigate(`/admin/workshops/${workshop.id}`)}
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Редактировать">
                                        <IconButton size="small" color="secondary" onClick={() => onEdit(workshop)}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Назначить исполнителей">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => onAssignExecutors(workshop)}
                                        >
                                            <PersonAddIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Удалить">
                                        <IconButton size="small" color="error" onClick={() => onDelete(workshop.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default WorkshopsList; 