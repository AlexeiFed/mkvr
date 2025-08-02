/**
 * @file: SchoolsList.tsx
 * @description: Компонент для отображения списка школ
 * @dependencies: react, react-redux, @mui/material
 * @created: 2024-07-06
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
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { fetchSchools, deleteSchool } from '../../store/schoolsSlice';
import type { RootState, AppDispatch } from '../../store';
import type { School } from '../../store/schoolsSlice';

interface SchoolsListProps {
    onViewSchool: (school: School) => void;
    onEditSchool: (school: School) => void;
    onCreateSchool: () => void;
}

const SchoolsList: React.FC<SchoolsListProps> = ({
    onViewSchool,
    onEditSchool,
    onCreateSchool,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { schools, isLoading, error } = useSelector((state: RootState) => state.schools);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(fetchSchools());
    }, [dispatch]);

    const handleDeleteSchool = async (schoolId: number) => {
        if (window.confirm('Вы уверены, что хотите удалить эту школу?')) {
            try {
                await dispatch(deleteSchool(schoolId)).unwrap();
            } catch (error) {
                console.error('Ошибка удаления школы:', error);
            }
        }
    };

            const canManageSchools = user && user.role === 'ADMIN';

    // Сортировка школ по алфавиту
    const sortedSchools = useMemo(() => {
        return [...schools].sort((a, b) => a.name.localeCompare(b.name));
    }, [schools]);

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
                    Школы
                </Typography>
                {canManageSchools && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onCreateSchool}
                    >
                        Добавить школу
                    </Button>
                )}
            </Box>

            {sortedSchools.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography variant="body1" color="text.secondary" textAlign="center">
                            Школы не найдены
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>№</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Название</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Адрес</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Классы</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedSchools.map((school, index) => (
                                <TableRow
                                    key={school.id}
                                    hover
                                    onClick={() => onViewSchool(school)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {index + 1}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {school.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {school.address || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {school.classes?.length || 0} классов
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label="Активна"
                                            color="success"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                        <IconButton
                                            size="small"
                                            onClick={() => onViewSchool(school)}
                                            title="Просмотр"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                        {canManageSchools && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onEditSchool(school)}
                                                    title="Редактировать"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteSchool(school.id)}
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

export default SchoolsList; 