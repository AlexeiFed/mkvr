/**
 * @file: AssignExecutorsModal.tsx
 * @description: Модальное окно для назначения исполнителей к мастер-классам
 * @dependencies: React, MUI, API services
 * @created: 2025-01-29
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    Chip,
    Typography,
    Box,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';
import { api } from '../../services/api';

interface Executor {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isPrimary?: boolean;
}

interface AssignExecutorsModalProps {
    open: boolean;
    onClose: () => void;
    workshopId: number;
    workshopTitle: string;
    currentExecutors: Executor[];
    onExecutorsAssigned: () => void;
}

const AssignExecutorsModal: React.FC<AssignExecutorsModalProps> = ({
    open,
    onClose,
    workshopId,
    workshopTitle,
    currentExecutors,
    onExecutorsAssigned
}) => {
    const [executors, setExecutors] = useState<Executor[]>([]);
    const [selectedExecutors, setSelectedExecutors] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadExecutors();
            setSelectedExecutors(currentExecutors.map(e => e.id));
        }
    }, [open, currentExecutors]);

    const loadExecutors = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users?role=executor');

            // API возвращает объект { users: [], total }
            if (response.data && Array.isArray(response.data.users)) {
                setExecutors(response.data.users);
            } else {
                console.error('API вернул неверный формат:', response.data);
                setError('Неверный формат данных от сервера');
                setExecutors([]);
            }
        } catch (error) {
            console.error('Ошибка при загрузке исполнителей:', error);
            setError('Не удалось загрузить список исполнителей');
            setExecutors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExecutorToggle = (executorId: number) => {
        setSelectedExecutors(prev =>
            prev.includes(executorId)
                ? prev.filter(id => id !== executorId)
                : [...prev, executorId]
        );
    };

    const handleAssign = async () => {
        try {
            setLoading(true);
            setError(null);

            await api.post(`/workshops/${workshopId}/executors`, {
                executorIds: selectedExecutors
            });

            onExecutorsAssigned();
            onClose();
        } catch (error: unknown) {
            console.error('Ошибка при назначении исполнителей:', error);
            const errorMessage = error instanceof Error ? error.message : 'Не удалось назначить исполнителей';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const filteredExecutors = Array.isArray(executors) ? executors.filter(executor =>
        `${executor.firstName} ${executor.lastName} ${executor.email}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6">
                        Назначить исполнителей
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Мастер-класс: {workshopTitle}
                </Typography>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Поиск исполнителей..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 2 }}
                />

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {filteredExecutors.map((executor) => (
                            <ListItem
                                key={executor.id}
                                dense
                                onClick={() => handleExecutorToggle(executor.id)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <Checkbox
                                    edge="start"
                                    checked={selectedExecutors.includes(executor.id)}
                                    tabIndex={-1}
                                    disableRipple
                                />
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body1">
                                                {executor.firstName} {executor.lastName}
                                            </Typography>
                                            {currentExecutors.some(e => e.id === executor.id) && (
                                                <Chip
                                                    label="Назначен"
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" color="text.secondary" component="span">
                                                {executor.email}
                                            </Typography>
                                            {executor.phone && (
                                                <Typography variant="body2" color="text.secondary" component="span" display="block">
                                                    {executor.phone}
                                                </Typography>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}

                {filteredExecutors.length === 0 && !loading && (
                    <Box textAlign="center" p={3}>
                        <Typography variant="body2" color="text.secondary">
                            Исполнители не найдены
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Отмена
                </Button>
                <Button
                    onClick={handleAssign}
                    variant="contained"
                    disabled={loading || selectedExecutors.length === 0}
                >
                    {loading ? <CircularProgress size={20} /> : 'Назначить'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssignExecutorsModal; 