/**
 * @file: WorkshopsContainer.tsx
 * @description: Основной компонент страницы мастер-классов
 * @dependencies: React, Redux, MUI, WorkshopsList, WorkshopCalendar, WorkshopFilters
 * @created: 2024-12-19
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { RootState, AppDispatch } from '../../store';
import { fetchWorkshops, fetchWorkshopsStatistics, setFilters, deleteWorkshop } from '../../store/workshopsSlice';
import { fetchSchools } from '../../store/schoolsSlice';
import WorkshopsList from './WorkshopsList';
import WorkshopCalendar from './WorkshopCalendar';
import WorkshopFilters from './WorkshopFilters';
import WorkshopForm from './WorkshopForm';
import type { Workshop } from '../../types';
import { io as socketIOClient, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

const WorkshopsContainer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { workshops, loading, filters } = useSelector((state: RootState) => state.workshops);
    const [showForm, setShowForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editWorkshop, setEditWorkshop] = useState<Workshop | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        dispatch(fetchSchools());
        dispatch(fetchWorkshops(filters));
        dispatch(fetchWorkshopsStatistics());

        // Подписка на WebSocket для live-обновления
        const socket: Socket = socketIOClient(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true
        });
        socket.on('workshop:updated', () => {
            dispatch(fetchWorkshops(filters));
            dispatch(fetchWorkshopsStatistics());
        });

        socket.on('order:cancelled', () => {
            dispatch(fetchWorkshops(filters));
            dispatch(fetchWorkshopsStatistics());
        });
        return () => {
            socket.disconnect();
        };
    }, [dispatch, filters]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setEditWorkshop(null);
        setShowForm(true);
    };

    const handleEdit = (workshop: Workshop) => {
        setEditWorkshop(workshop);
        setSelectedDate(null);
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteId) {
            await dispatch(deleteWorkshop(String(deleteId)));
            setShowDeleteDialog(false);
            setDeleteId(null);
            dispatch(fetchWorkshops(filters));
            dispatch(fetchWorkshopsStatistics());
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteDialog(false);
        setDeleteId(null);
    };

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        dispatch(setFilters(newFilters));
    };

    const handleFormClose = () => {
        setShowForm(false);
        setSelectedDate(null);
        setEditWorkshop(null);
    };

    const handleFormSuccess = () => {
        handleFormClose();
        dispatch(fetchWorkshops(filters));
        dispatch(fetchWorkshopsStatistics());
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Фильтры */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <WorkshopFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            </Paper>

            {/* Основной контент с календарем */}
            <Box sx={{ display: 'flex', gap: 3 }}>
                {/* Таблица мастер-классов */}
                <Box sx={{ flex: 1 }}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Список мастер-классов</Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setShowForm(true);
                                    setEditWorkshop(null);
                                    setSelectedDate(null);
                                }}
                            >
                                Добавить мастер-класс
                            </Button>
                        </Box>
                    </Paper>

                    <WorkshopsList
                        workshops={workshops}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </Box>

                {/* Календарь в правом углу */}
                <Box sx={{ width: 350, flexShrink: 0 }}>
                    <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
                        <WorkshopCalendar
                            workshops={workshops}
                            onDateSelect={handleDateSelect}
                        />
                    </Paper>
                </Box>
            </Box>

            {/* Форма добавления/редактирования */}
            <Dialog
                open={showForm}
                onClose={handleFormClose}
                maxWidth="md"
                fullWidth
            >
                <WorkshopForm
                    selectedDate={selectedDate}
                    editWorkshop={editWorkshop}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            </Dialog>

            {/* Диалог подтверждения удаления */}
            <Dialog open={showDeleteDialog} onClose={handleDeleteCancel}>
                <DialogTitle>Удалить мастер-класс?</DialogTitle>
                <DialogContent>Вы уверены, что хотите удалить мастер-класс? Это действие необратимо.</DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Отмена</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">Удалить</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WorkshopsContainer; 