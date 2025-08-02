/**
 * @file: ChildProfile.tsx
 * @description: Компонент профиля ребёнка с возможностью редактирования и динамической загрузкой школ и классов
 * @dependencies: React, MUI, types, API школ и классов
 * @created: 2024-07-12
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    TextField,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slide,
    Grow,
    Zoom,
    useTheme,
    useMediaQuery,
    Autocomplete,
    CircularProgress,
    IconButton
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    School as SchoolIcon,
    Cake as CakeIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import type { User } from '../../store/authSlice';
import api from '../../services/api';

interface School {
    id: number;
    name: string;
    address: string;
    classes: Class[];
}

interface Class {
    id: number;
    name: string;
    shift: string | null;
    schoolId: number;
}

interface ChildProfileProps {
    open: boolean;
    currentUser: User;
    onClose: () => void;
    onLogout: () => void;
    onUpdateProfile: (updatedUser: Partial<User>) => void;
}

const ChildProfile: React.FC<ChildProfileProps> = ({
    open,
    currentUser,
    onClose,
    onLogout,
    onUpdateProfile
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone || '',
        city: currentUser.city || '',
        schoolId: currentUser.school ? parseInt(currentUser.school) : undefined,
        classId: currentUser.grade ? parseInt(currentUser.grade) : undefined,
        shift: currentUser.shift || '',
        age: currentUser.age || 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Состояние для школ и классов
    const [schools, setSchools] = useState<School[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [shifts, setShifts] = useState<string[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(false);
    const [schoolsError, setSchoolsError] = useState<string | null>(null);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

    const [schoolName, setSchoolName] = useState<string>('');
    const [className, setClassName] = useState<string>('');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Загрузка школ при открытии диалога
    useEffect(() => {
        if (open && isEditing) {
            fetchSchools();
        }
    }, [open, isEditing]);

    // Обновление классов при выборе школы
    useEffect(() => {
        if (selectedSchool) {
            setClasses(selectedSchool.classes || []);
            // Получаем уникальные смены из классов школы
            const uniqueShifts = [...new Set(
                selectedSchool.classes
                    .map(cls => cls.shift)
                    .filter(shift => shift !== null) as string[]
            )];
            setShifts(uniqueShifts);
        } else {
            setClasses([]);
            setShifts([]);
        }
    }, [selectedSchool]);

    // Установка выбранной школы при загрузке данных
    useEffect(() => {
        if (schools.length > 0 && formData.schoolId) {
            const school = schools.find(s => s.id === formData.schoolId);
            if (school) {
                setSelectedSchool(school);
            }
        }
    }, [schools, formData.schoolId]);

    useEffect(() => {
        // Если профиль открыт и не в режиме редактирования, обновляем данные из currentUser
        if (open && !isEditing) {
            setFormData({
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                email: currentUser.email,
                phone: currentUser.phone || '',
                city: currentUser.city || '',
                schoolId: currentUser.school ? parseInt(currentUser.school) : undefined,
                classId: currentUser.grade ? parseInt(currentUser.grade) : undefined,
                shift: currentUser.shift || '',
                age: currentUser.age || 0
            });
        }
    }, [open, isEditing, currentUser]);

    // Загружаем справочник школ и классов для отображения названий в режиме просмотра
    useEffect(() => {
        if (open && !isEditing && currentUser.school && currentUser.grade) {
            // Загружаем школы
            fetch('http://localhost:3001/api/schools')
                .then(res => res.json())
                .then(data => {
                    const schools: School[] = data.schools || [];
                    const school = schools.find(s => s.id === parseInt(String(currentUser.school)));
                    setSchoolName(school ? school.name : 'Не указана');
                    if (school) {
                        const classItem = school.classes.find(c => c.id === parseInt(String(currentUser.grade)));
                        setClassName(classItem ? classItem.name : 'Не указан');
                    } else {
                        setClassName('Не указан');
                    }
                })
                .catch(() => {
                    setSchoolName('Не указана');
                    setClassName('Не указан');
                });
        } else if (!open || isEditing) {
            setSchoolName('');
            setClassName('');
        }
    }, [open, isEditing, currentUser.school, currentUser.grade]);

    const fetchSchools = async () => {
        setLoadingSchools(true);
        setSchoolsError(null);
        try {
            const response = await api.get('/schools');
            if (!response.data.success) {
                throw new Error('Ошибка загрузки школ');
            }
            setSchools(response.data.schools || []);
        } catch (error) {
            console.error('Ошибка загрузки школ:', error);
            setSchoolsError('Ошибка загрузки школ: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
            setSchools([]);
        } finally {
            setLoadingSchools(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setError(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            phone: currentUser.phone || '',
            city: currentUser.city || '',
            schoolId: currentUser.school ? parseInt(currentUser.school) : undefined,
            classId: currentUser.grade ? parseInt(currentUser.grade) : undefined,
            shift: currentUser.shift || '',
            age: currentUser.age || 0
        });
        setSelectedSchool(null);
        setError(null);
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!formData.firstName.trim() || !formData.lastName.trim()) {
                throw new Error('Имя и фамилия обязательны');
            }
            if (formData.age < 3 || formData.age > 18) {
                throw new Error('Возраст должен быть от 3 до 18 лет');
            }

            // Подготавливаем данные для сохранения
            const updateData = {
                ...formData,
                school: formData.schoolId?.toString() || '',
                grade: formData.classId?.toString() || ''
            };

            await new Promise(resolve => setTimeout(resolve, 1000));
            onUpdateProfile(updateData);
            setIsEditing(false);
            // После обновления профиля обновляем данные пользователя в store
            setFormData(updateData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при сохранении');
        } finally {
            setLoading(false);
        }
    };

    const handleSchoolChange = (school: School | null) => {
        setSelectedSchool(school);
        setFormData(prev => ({
            ...prev,
            schoolId: school?.id,
            classId: undefined,
            shift: ''
        }));
    };

    const handleClassChange = (classItem: Class | null) => {
        setFormData(prev => ({
            ...prev,
            classId: classItem?.id,
            shift: classItem?.shift || ''
        }));
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getAgeText = (age: number) => {
        if (age === 1) return 'год';
        if (age >= 2 && age <= 4) return 'года';
        return 'лет';
    };



    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 4,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    maxHeight: isMobile ? '100vh' : '90vh'
                }
            }}
            TransitionComponent={Slide}
            transitionDuration={400}
        >
            <DialogTitle sx={{
                fontFamily: '"Fredoka One", Arial, sans-serif',
                fontSize: isMobile ? 24 : 28,
                color: '#FF6B9D',
                textAlign: 'center',
                pb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Zoom in={open}>
                    <Box>Мой профиль 👤</Box>
                </Zoom>
                <IconButton onClick={onClose} sx={{ color: '#666' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
                {error && (
                    <Slide direction="up" in={!!error} mountOnEnter>
                        <Box sx={{
                            p: 2,
                            mb: 2,
                            background: '#ffebee',
                            borderRadius: 2,
                            border: '1px solid #f44336'
                        }}>
                            <Typography color="error" sx={{ fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                {error}
                            </Typography>
                        </Box>
                    </Slide>
                )}

                {/* Аватар и основная информация */}
                <Slide direction="down" in={open} mountOnEnter>
                    <Card sx={{ mb: 3, background: 'linear-gradient(45deg, #FF6B9D, #FF8E53)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Zoom in={open} timeout={500}>
                                <Avatar sx={{
                                    width: 80,
                                    height: 80,
                                    fontSize: 32,
                                    margin: '0 auto 16px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: '3px solid rgba(255, 255, 255, 0.3)'
                                }}>
                                    {getInitials(currentUser.firstName, currentUser.lastName)}
                                </Avatar>
                            </Zoom>
                            <Typography variant="h5" sx={{ fontFamily: '"Fredoka One", Arial, sans-serif', mb: 1 }}>
                                {currentUser.firstName} {currentUser.lastName}
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                {currentUser.age} {getAgeText(currentUser.age || 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Slide>

                {/* Информация профиля */}
                <Grow in={open} timeout={600} mountOnEnter>
                    <Box>
                        {isEditing ? (
                            // Форма редактирования
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                                    <TextField
                                        label="Имя"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        fullWidth
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                fontFamily: '"Fredoka One", Arial, sans-serif'
                                            }
                                        }}
                                    />
                                    <TextField
                                        label="Фамилия"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        fullWidth
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                fontFamily: '"Fredoka One", Arial, sans-serif'
                                            }
                                        }}
                                    />
                                </Box>

                                <TextField
                                    label="Email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    fullWidth
                                    type="email"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            fontFamily: '"Fredoka One", Arial, sans-serif'
                                        }
                                    }}
                                />

                                <TextField
                                    label="Телефон"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            fontFamily: '"Fredoka One", Arial, sans-serif'
                                        }
                                    }}
                                />

                                <TextField
                                    label="Город"
                                    value={formData.city}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            fontFamily: '"Fredoka One", Arial, sans-serif'
                                        }
                                    }}
                                />

                                {/* Автокомплит школы */}
                                <Autocomplete
                                    options={schools}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedSchool}
                                    onChange={(_event, newValue) => handleSchoolChange(newValue)}
                                    loading={loadingSchools}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Школа"
                                            required
                                            error={!!schoolsError}
                                            helperText={schoolsError}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {loadingSchools ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    fontFamily: '"Fredoka One", Arial, sans-serif'
                                                }
                                            }}
                                        />
                                    )}
                                    disabled={loadingSchools}
                                />

                                {/* Автокомплит класса */}
                                <Autocomplete
                                    options={classes}
                                    getOptionLabel={(option) => option.name}
                                    value={classes.find(cls => cls.id === formData.classId) || null}
                                    onChange={(_event, newValue) => handleClassChange(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Класс"
                                            required
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    fontFamily: '"Fredoka One", Arial, sans-serif'
                                                }
                                            }}
                                        />
                                    )}
                                    disabled={!selectedSchool}
                                />

                                {/* Селект смены */}
                                <FormControl fullWidth>
                                    <InputLabel>Смена</InputLabel>
                                    <Select
                                        value={shifts.length > 0 ? formData.shift : ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value }))}
                                        label="Смена"
                                        sx={{ fontFamily: '"Fredoka One", Arial, sans-serif' }}
                                    >
                                        <MenuItem value="">Не выбрана</MenuItem>
                                        {shifts.map((shift) => (
                                            <MenuItem key={shift} value={shift}>
                                                {shift}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Возраст"
                                    value={formData.age}
                                    onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                                    fullWidth
                                    type="number"
                                    inputProps={{ min: 3, max: 18 }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            fontFamily: '"Fredoka One", Arial, sans-serif'
                                        }
                                    }}
                                />
                            </Box>
                        ) : (
                            // Просмотр информации
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Card sx={{ p: 2, background: 'rgba(255, 255, 255, 0.8)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                        <EmailIcon sx={{ color: '#FF6B9D' }} />
                                        <Typography variant="subtitle2" sx={{ color: '#666', fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                            Email
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                        {currentUser.email}
                                    </Typography>
                                </Card>

                                {currentUser.phone && (
                                    <Card sx={{ p: 2, background: 'rgba(255, 255, 255, 0.8)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <PhoneIcon sx={{ color: '#FF6B9D' }} />
                                            <Typography variant="subtitle2" sx={{ color: '#666', fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                                Телефон
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" sx={{ fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                            {currentUser.phone}
                                        </Typography>
                                    </Card>
                                )}

                                {currentUser.city && (
                                    <Card sx={{ p: 2, background: 'rgba(255, 255, 255, 0.8)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <LocationIcon sx={{ color: '#FF6B9D' }} />
                                            <Typography variant="subtitle2" sx={{ color: '#666', fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                                Город
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" sx={{ fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                            {currentUser.city}
                                        </Typography>
                                    </Card>
                                )}

                                <Card sx={{ p: 2, background: 'rgba(255, 255, 255, 0.8)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                        <SchoolIcon sx={{ color: '#FF6B9D' }} />
                                        <Typography variant="subtitle2" sx={{ color: '#666', fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                            Школа и класс
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                        {schoolName || 'Не указана'} • {className || 'Не указан'}
                                    </Typography>
                                </Card>

                                {currentUser.shift && (
                                    <Card sx={{ p: 2, background: 'rgba(255, 255, 255, 0.8)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <CakeIcon sx={{ color: '#FF6B9D' }} />
                                            <Typography variant="subtitle2" sx={{ color: '#666', fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                                Смена
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" sx={{ fontFamily: '"Fredoka One", Arial, sans-serif' }}>
                                            {currentUser.shift}
                                        </Typography>
                                    </Card>
                                )}
                            </Box>
                        )}
                    </Box>
                </Grow>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                {isEditing ? (
                    <>
                        <Button
                            onClick={handleCancel}
                            startIcon={<CancelIcon />}
                            variant="outlined"
                            sx={{
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                color: '#666',
                                borderColor: '#ddd'
                            }}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleSave}
                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            variant="contained"
                            disabled={loading}
                            sx={{
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                background: 'linear-gradient(45deg, #FF6B9D, #FF8E53)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #FF5A8A, #FF7A40)'
                                }
                            }}
                        >
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            onClick={onClose}
                            variant="outlined"
                            sx={{
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                color: '#666',
                                borderColor: '#ddd'
                            }}
                        >
                            Закрыть
                        </Button>
                        <Button
                            onClick={onLogout}
                            variant="outlined"
                            sx={{
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                color: '#f44336',
                                borderColor: '#f44336',
                                '&:hover': {
                                    borderColor: '#d32f2f',
                                    backgroundColor: 'rgba(244, 67, 54, 0.04)'
                                }
                            }}
                        >
                            Выйти
                        </Button>
                        <Button
                            onClick={handleEdit}
                            startIcon={<EditIcon />}
                            variant="contained"
                            sx={{
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                background: 'linear-gradient(45deg, #FF6B9D, #FF8E53)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #FF5A8A, #FF7A40)'
                                }
                            }}
                        >
                            Редактировать
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ChildProfile; 