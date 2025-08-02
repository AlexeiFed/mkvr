/**
 * @file: RegisterForm.tsx
 * @description: Компонент формы регистрации пользователя с условными полями для разных ролей
 * @dependencies: @mui/material, react-redux, react-hook-form
 * @created: 2024-07-06
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Link,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Divider,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import { registerUser, clearError } from '../../store/authSlice';
import type { RootState, AppDispatch } from '../../store';
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

interface RegisterFormData {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    role: 'admin' | 'executor' | 'parent' | 'child';
    age: number;
    // Поля для ребенка и родителя
    schoolId?: number;
    classId?: number;
    shift?: string;
    // Поля для ребенка при регистрации родителя
    childFirstName?: string;
    childLastName?: string;
    childAge?: number;
}

interface RegisterFormProps {
    onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { isLoading, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);
    const [shifts, setShifts] = useState<string[]>([]);

    // Перенаправление после успешной регистрации
    useEffect(() => {
        if (isAuthenticated && user) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    // Загрузка школ при монтировании компонента
    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            const response = await api.get('/schools');
            setSchools(response.data.schools || []);
        } catch (error) {
            console.error('Ошибка загрузки школ:', error);
        }
    };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RegisterFormData>({
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            password: '',
            confirmPassword: '',
            role: 'child',
            age: 0,
        },
    });

    const password = watch('password');
    const selectedRole = watch('role');
    const watchedSchoolId = watch('schoolId');

    // Обновление классов при выборе школы
    useEffect(() => {
        if (watchedSchoolId && selectedSchool) {
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
    }, [watchedSchoolId, selectedSchool]);

    const onSubmit = async (data: RegisterFormData) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...registerData } = data;
        dispatch(clearError());
        await dispatch(registerUser(registerData));
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleToggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSchoolChange = (school: School | null) => {
        setSelectedSchool(school);
        setValue('schoolId', school?.id);
        setValue('classId', undefined);
        setValue('shift', undefined);
    };

    const handleClassChange = (classItem: Class | null) => {
        setValue('classId', classItem?.id);
        if (classItem?.shift) {
            setValue('shift', classItem.shift);
        }
    };

    const renderChildFields = () => (
        <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
                Информация о ребенке
            </Typography>

            <Controller
                name="childFirstName"
                control={control}
                rules={{
                    required: 'Имя ребенка обязательно',
                    minLength: {
                        value: 2,
                        message: 'Имя должно содержать минимум 2 символа',
                    },
                }}
                render={({ field }) => (
                    <TextField
                        {...field}
                        margin="normal"
                        required
                        fullWidth
                        id="childFirstName"
                        label="Имя ребенка"
                        error={!!errors.childFirstName}
                        helperText={errors.childFirstName?.message}
                        disabled={isLoading}
                    />
                )}
            />

            <Controller
                name="childLastName"
                control={control}
                rules={{
                    required: 'Фамилия ребенка обязательна',
                    minLength: {
                        value: 2,
                        message: 'Фамилия должна содержать минимум 2 символа',
                    },
                }}
                render={({ field }) => (
                    <TextField
                        {...field}
                        margin="normal"
                        required
                        fullWidth
                        id="childLastName"
                        label="Фамилия ребенка"
                        error={!!errors.childLastName}
                        helperText={errors.childLastName?.message}
                        disabled={isLoading}
                    />
                )}
            />

            <Controller
                name="childAge"
                control={control}
                rules={{
                    required: 'Возраст ребенка обязателен',
                    min: { value: 1, message: 'Возраст должен быть больше 0' },
                    max: { value: 18, message: 'Возраст должен быть не больше 18' },
                    validate: value => Number.isInteger(Number(value)) || 'Возраст должен быть целым числом',
                }}
                render={({ field }) => (
                    <TextField
                        {...field}
                        margin="normal"
                        required
                        fullWidth
                        type="number"
                        id="childAge"
                        label="Возраст ребенка"
                        inputProps={{ min: 1, max: 18, step: 1 }}
                        error={!!errors.childAge}
                        helperText={errors.childAge?.message}
                        disabled={isLoading}
                    />
                )}
            />
        </>
    );

    const renderSchoolFields = () => (
        <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
                Информация об образовании
            </Typography>

            <Autocomplete
                options={schools}
                getOptionLabel={(option) => option.name}
                value={selectedSchool}
                onChange={(_event, newValue) => handleSchoolChange(newValue)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="normal"
                        required
                        fullWidth
                        label="Школа"
                        error={!!errors.schoolId}
                        helperText={errors.schoolId?.message}
                        disabled={isLoading}
                    />
                )}
                disabled={isLoading}
            />

            <Autocomplete
                options={classes}
                getOptionLabel={(option) => option.name}
                value={classes.find(cls => cls.id === watch('classId')) || null}
                onChange={(_event, newValue) => handleClassChange(newValue)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="normal"
                        required
                        fullWidth
                        label="Класс"
                        error={!!errors.classId}
                        helperText={errors.classId?.message}
                        disabled={isLoading || !selectedSchool}
                    />
                )}
                disabled={isLoading || !selectedSchool}
            />

            <Controller
                name="shift"
                control={control}
                rules={{ required: 'Смена обязательна' }}
                render={({ field }) => (
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="shift-label">Смена</InputLabel>
                        <Select
                            {...field}
                            labelId="shift-label"
                            id="shift"
                            label="Смена"
                            disabled={isLoading || shifts.length === 0}
                        >
                            {shifts.map((shift) => (
                                <MenuItem key={shift} value={shift}>
                                    {shift}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            />
        </>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: 4,
                    width: '100%',
                    maxWidth: 500,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Регистрация
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Создайте новый аккаунт
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Controller
                        name="firstName"
                        control={control}
                        rules={{
                            required: 'Имя обязательно',
                            minLength: {
                                value: 2,
                                message: 'Имя должно содержать минимум 2 символа',
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                id="firstName"
                                label="Имя"
                                autoComplete="given-name"
                                autoFocus
                                error={!!errors.firstName}
                                helperText={errors.firstName?.message}
                                disabled={isLoading}
                            />
                        )}
                    />

                    <Controller
                        name="lastName"
                        control={control}
                        rules={{
                            required: 'Фамилия обязательна',
                            minLength: {
                                value: 2,
                                message: 'Фамилия должна содержать минимум 2 символа',
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                id="lastName"
                                label="Фамилия"
                                autoComplete="family-name"
                                error={!!errors.lastName}
                                helperText={errors.lastName?.message}
                                disabled={isLoading}
                            />
                        )}
                    />

                    <Controller
                        name="email"
                        control={control}
                        rules={{
                            required: 'Email обязателен',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Некорректный email',
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email"
                                autoComplete="email"
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                disabled={isLoading}
                            />
                        )}
                    />

                    <Controller
                        name="role"
                        control={control}
                        rules={{ required: 'Роль обязательна' }}
                        render={({ field }) => (
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="role-label">Роль</InputLabel>
                                <Select
                                    {...field}
                                    labelId="role-label"
                                    id="role"
                                    label="Роль"
                                    disabled={isLoading}
                                >
                                    <MenuItem value="child">Ребенок</MenuItem>
                                    <MenuItem value="parent">Родитель</MenuItem>
                                    <MenuItem value="executor">Исполнитель</MenuItem>
                                    <MenuItem value="admin">Администратор</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    />

                    <Controller
                        name="password"
                        control={control}
                        rules={{
                            required: 'Пароль обязателен',
                            minLength: {
                                value: 6,
                                message: 'Пароль должен содержать минимум 6 символов',
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                label="Пароль"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="new-password"
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                disabled={isLoading}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleTogglePasswordVisibility}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="confirmPassword"
                        control={control}
                        rules={{
                            required: 'Подтверждение пароля обязательно',
                            validate: (value) =>
                                value === password || 'Пароли не совпадают',
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                label="Подтвердите пароль"
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                autoComplete="new-password"
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword?.message}
                                disabled={isLoading}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle confirm password visibility"
                                                onClick={handleToggleConfirmPasswordVisibility}
                                                edge="end"
                                            >
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="age"
                        control={control}
                        rules={{
                            required: 'Возраст обязателен',
                            min: { value: 1, message: 'Возраст должен быть больше 0' },
                            validate: value => Number.isInteger(Number(value)) || 'Возраст должен быть целым числом',
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                type="number"
                                id="age"
                                label="Возраст"
                                inputProps={{ min: 1, step: 1 }}
                                error={!!errors.age}
                                helperText={errors.age?.message}
                                disabled={isLoading}
                            />
                        )}
                    />

                    <Controller
                        name="schoolId"
                        control={control}
                        rules={{
                            required: (selectedRole === 'child' || selectedRole === 'parent') ? 'Школа обязательна' : false,
                        }}
                        render={({ field }) => (
                            <input type="hidden" {...field} />
                        )}
                    />

                    <Controller
                        name="classId"
                        control={control}
                        rules={{
                            required: (selectedRole === 'child' || selectedRole === 'parent') ? 'Класс обязателен' : false,
                        }}
                        render={({ field }) => (
                            <input type="hidden" {...field} />
                        )}
                    />

                    <Controller
                        name="shift"
                        control={control}
                        rules={{
                            required: (selectedRole === 'child' || selectedRole === 'parent') ? 'Смена обязательна' : false,
                        }}
                        render={({ field }) => (
                            <input type="hidden" {...field} />
                        )}
                    />

                    {/* Поля для роли "ребенок" */}
                    {selectedRole === 'child' && renderSchoolFields()}

                    {/* Поля для роли "родитель" */}
                    {selectedRole === 'parent' && (
                        <>
                            {renderSchoolFields()}
                            {renderChildFields()}
                        </>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
                    </Button>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Уже есть аккаунт?{' '}
                            <Link
                                component="button"
                                variant="body2"
                                onClick={onSwitchToLogin}
                                sx={{ cursor: 'pointer' }}
                            >
                                Войти
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default RegisterForm; 