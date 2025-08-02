/**
 * @file: SchoolDetails.tsx
 * @description: Компонент для отображения деталей школы
 * @dependencies: react, @mui/material
 * @created: 2024-07-06
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Add as AddIcon, Edit as Edit, Delete } from '@mui/icons-material';
import ClassForm from './ClassForm';
import ClassEditForm from './ClassEditForm';
import { fetchSchoolById } from '../../store/schoolsSlice';
import type { Class } from '../../store/schoolsSlice';
import type { RootState, AppDispatch } from '../../store';

interface SchoolDetailsProps {
    schoolId: number;
    onBack: () => void;
    onEdit?: () => void;
}

const SchoolDetails: React.FC<SchoolDetailsProps> = ({
    schoolId,
    onBack,
    onEdit,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentSchool } = useSelector((state: RootState) => state.schools);
    const [showClassForm, setShowClassForm] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);

    // Загружаем данные школы при монтировании компонента
    useEffect(() => {
        dispatch(fetchSchoolById(schoolId));
    }, [dispatch, schoolId]);

    // Функция для сортировки классов (1А, 1Б, 2А, 2Б и т.д.)
    const sortedClasses = useMemo(() => {
        if (!currentSchool?.classes) return [];

        return [...currentSchool.classes].sort((a, b) => {
            // Извлекаем номер и букву из названия класса
            const aMatch = a.name.match(/^(\d+)([А-Яа-я]*)$/);
            const bMatch = b.name.match(/^(\d+)([А-Яа-я]*)$/);

            if (!aMatch || !bMatch) {
                // Если не удалось распарсить, сортируем по алфавиту
                return a.name.localeCompare(b.name);
            }

            const aNum = parseInt(aMatch[1]);
            const bNum = parseInt(bMatch[1]);
            const aLetter = aMatch[2].toUpperCase();
            const bLetter = bMatch[2].toUpperCase();

            // Сначала по номеру, потом по букве
            if (aNum !== bNum) {
                return aNum - bNum;
            }
            return aLetter.localeCompare(bLetter);
        });
    }, [currentSchool?.classes]);

    const handleClassCreated = async () => {
        setShowClassForm(false);
        // Обновляем данные школы после создания класса
        await dispatch(fetchSchoolById(schoolId));
    };

    const handleEditClass = (classItem: Class) => {
        setEditingClass(classItem);
    };

    const handleDeleteClass = (classId: number) => {
        // TODO: Реализовать удаление класса
        console.log('Удаление класса:', classId);
    };

    const handleEditCancel = () => {
        setEditingClass(null);
    };

    const handleEditSuccess = () => {
        setEditingClass(null);
        // Перезагружаем данные школы
        dispatch(fetchSchoolById(schoolId));
    };

    if (!currentSchool) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>Загрузка...</Typography>
            </Box>
        );
    }

    if (showClassForm) {
        return (
            <ClassForm
                schoolId={currentSchool.id}
                onCancel={() => setShowClassForm(false)}
                onSuccess={handleClassCreated}
            />
        );
    }

    if (editingClass) {
        return (
            <ClassEditForm
                classItem={editingClass}
                onCancel={handleEditCancel}
                onSuccess={handleEditSuccess}
            />
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                    sx={{ mr: 2 }}
                >
                    Назад
                </Button>
                <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                    Детали школы
                </Typography>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setShowClassForm(true)}
                    >
                        Добавить класс
                    </Button>
                    {onEdit && (
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={onEdit}
                        >
                            Редактировать
                        </Button>
                    )}
                </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={3}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Основная информация
                        </Typography>
                        <Box mb={2}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Название
                            </Typography>
                            <Typography variant="body1">
                                {currentSchool.name}
                            </Typography>
                        </Box>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {currentSchool.address}
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Информация о школе
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Статус: {currentSchool.isActive ? 'Активна' : 'Неактивна'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Дата создания: {new Date(currentSchool.createdAt).toLocaleDateString('ru-RU')}
                            </Typography>
                        </Box>
                        <Box mb={2}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Статус
                            </Typography>
                            <Chip
                                label="Активна"
                                color="success"
                                size="small"
                            />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Классы ({sortedClasses.length})
                        </Typography>
                        {sortedClasses.length > 0 ? (
                            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Название</TableCell>
                                            <TableCell>Школа</TableCell>
                                            <TableCell>Дата создания</TableCell>
                                            <TableCell>Действия</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {currentSchool.classes?.map((classItem) => (
                                            <TableRow key={classItem.id}>
                                                <TableCell>{classItem.id}</TableCell>
                                                <TableCell>{classItem.name}</TableCell>
                                                <TableCell>
                                                    {classItem.school?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(classItem.createdAt).toLocaleDateString('ru-RU')}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEditClass(classItem)}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteClass(classItem.id)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Классы не найдены
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default SchoolDetails; 