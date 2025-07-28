/**
 * @file: ChildWorkshopsList.tsx
 * @description: Компонент списка мастер-классов для ребёнка с фильтрацией и анимациями
 * @dependencies: React, MUI, types, ChildLayout
 * @created: 2024-07-12
 */

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Chip,
    Avatar,
    CircularProgress,
    Paper,
    Fade,
    Slide,
    Grow,
    Zoom,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    School as SchoolIcon,
    Class as ClassIcon,
    AccessTime as TimeIcon,
    Event as EventIcon,
    Group as GroupIcon,
    EmojiEvents as TrophyIcon,
    Celebration as CelebrationIcon
} from '@mui/icons-material';
import type { Workshop, WorkshopOrder } from '../../types';
import type { User } from '../../store/authSlice';

interface ChildWorkshopsListProps {
    workshops: Workshop[];
    loading: boolean;
    currentUser: User;
    onSignUp: (workshopId: number) => void;
    onEditOrder?: (workshop: Workshop, order: WorkshopOrder) => void; // <--- добавлено
}

const ChildWorkshopsList: React.FC<ChildWorkshopsListProps> = ({
    workshops,
    loading,
    currentUser,
    onSignUp,
    onEditOrder
}) => {
    const [filteredWorkshops, setFilteredWorkshops] = useState<Workshop[]>([]);
    const [showCelebration, setShowCelebration] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Обработка мастер-классов
    useEffect(() => {
        console.log('ChildWorkshopsList: Получены мастер-классы:', {
            workshopsCount: workshops?.length || 0,
            workshops: workshops?.map(w => ({ id: w.id, school: w.school?.name, class: w.class?.name }))
        });

        if (!workshops || !currentUser) return;

        // Данные уже отфильтрованы на backend, просто сортируем по дате
        const sorted = [...workshops].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });

        console.log('ChildWorkshopsList: Отсортированные мастер-классы:', sorted.length);
        setFilteredWorkshops(sorted);

        // Показываем праздничную анимацию при загрузке
        if (sorted.length > 0) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
        }
    }, [workshops, currentUser]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time: string) => {
        return time;
    };

    const getStatusEmoji = (status: string) => {
        switch (status) {
            case 'scheduled': return '📅';
            case 'in-progress': return '🎨';
            case 'completed': return '🏆';
            case 'cancelled': return '❌';
            default: return '📋';
        }
    };

    const handleSignUpClick = (workshopId: number) => {
        // Добавляем анимацию нажатия
        const button = document.querySelector(`[data-workshop-id="${workshopId}"]`);
        if (button) {
            button.classList.add('pulse-animation');
            setTimeout(() => {
                button.classList.remove('pulse-animation');
                onSignUp(workshopId);
            }, 300);
        } else {
            onSignUp(workshopId);
        }
    };

    if (loading) {
        return (
            <Fade in={loading}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '50vh',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <Zoom in={loading}>
                        <CircularProgress size={60} sx={{ color: '#fff' }} />
                    </Zoom>
                    <Slide direction="up" in={loading} mountOnEnter unmountOnExit>
                        <Typography
                            variant="h6"
                            sx={{
                                color: '#fff',
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                fontSize: isMobile ? 18 : 20
                            }}
                        >
                            Загружаем мастер-классы... 🎨
                        </Typography>
                    </Slide>
                </Box>
            </Fade>
        );
    }

    if (filteredWorkshops.length === 0) {
        return (
            <Fade in={true}>
                <Paper sx={{
                    p: isMobile ? 3 : 4,
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    margin: 2
                }}>
                    <Zoom in={true}>
                        <Box sx={{ fontSize: isMobile ? 60 : 80, marginBottom: 2 }}>🎨</Box>
                    </Zoom>
                    <Slide direction="up" in={true} mountOnEnter>
                        <Typography
                            variant="h5"
                            sx={{
                                color: '#fff',
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                marginBottom: 2,
                                fontSize: isMobile ? 24 : 28
                            }}
                        >
                            Пока нет мастер-классов
                        </Typography>
                    </Slide>
                    <Slide direction="up" in={true} mountOnEnter timeout={300}>
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                fontSize: isMobile ? 16 : 18
                            }}
                        >
                            Скоро появятся новые интересные занятия! 🌟
                        </Typography>
                    </Slide>
                </Paper>
            </Fade>
        );
    }

    return (
        <Box sx={{ p: isMobile ? 1 : 2 }}>
            {/* Праздничная анимация */}
            {showCelebration && (
                <Fade in={showCelebration}>
                    <Box sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 9999,
                        textAlign: 'center'
                    }}>
                        <Zoom in={showCelebration}>
                            <CelebrationIcon sx={{
                                fontSize: 80,
                                color: '#FFD700',
                                animation: 'bounce 1s infinite'
                            }} />
                        </Zoom>
                        <Slide direction="up" in={showCelebration} mountOnEnter>
                            <Typography
                                variant="h4"
                                sx={{
                                    color: '#FFD700',
                                    fontFamily: '"Fredoka One", Arial, sans-serif',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                                }}
                            >
                                Ура! 🎉
                            </Typography>
                        </Slide>
                    </Box>
                </Fade>
            )}

            <Slide direction="down" in={true} mountOnEnter>
                <Typography
                    variant="h4"
                    sx={{
                        color: '#fff',
                        fontFamily: '"Fredoka One", Arial, sans-serif',
                        textAlign: 'center',
                        marginBottom: 3,
                        fontSize: isMobile ? 28 : 32
                    }}
                >
                    Твои мастер-классы 🎨
                </Typography>
            </Slide>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                },
                gap: isMobile ? 2 : 3
            }}>
                {filteredWorkshops.map((workshop, index) => {
                    // Определяем, записан ли ребёнок
                    const childOrder = (workshop.orders || []).find(o => o.childId === currentUser.id);
                    const isRegistered = !!childOrder || workshop.isChildRegistered;
                    return (
                        <Grow
                            key={workshop.id}
                            in={true}
                            timeout={300 + index * 100}
                            mountOnEnter
                        >
                            <Card sx={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 4,
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                border: '3px solid #FF6B9D',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-8px) scale(1.02)',
                                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
                                    borderColor: '#FF8E53',
                                    '& .workshop-card-content': {
                                        transform: 'scale(1.05)'
                                    }
                                },
                                '& .pulse-animation': {
                                    animation: 'pulse 0.3s ease-in-out'
                                }
                            }}>
                                <CardContent sx={{
                                    p: isMobile ? 2 : 3,
                                    transition: 'transform 0.3s ease',
                                    className: 'workshop-card-content'
                                }}>
                                    {/* Заголовок карточки */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: 2,
                                        gap: 1
                                    }}>
                                        <Zoom in={true} timeout={500 + index * 100}>
                                            <Avatar sx={{
                                                bgcolor: '#FF6B9D',
                                                width: isMobile ? 35 : 40,
                                                height: isMobile ? 35 : 40,
                                                fontSize: isMobile ? 18 : 20
                                            }}>
                                                {getStatusEmoji(workshop.status)}
                                            </Avatar>
                                        </Zoom>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                                color: '#333',
                                                fontSize: isMobile ? 18 : 20
                                            }}
                                        >
                                            {workshop.service?.name || 'Мастер-класс'}
                                        </Typography>
                                    </Box>

                                    {/* Информация о дате и времени */}
                                    <Box sx={{ marginBottom: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                                            <EventIcon sx={{ color: '#FF6B9D', fontSize: isMobile ? 18 : 20 }} />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: '"Fredoka One", Arial, sans-serif',
                                                    color: '#666',
                                                    fontSize: isMobile ? 14 : 16
                                                }}
                                            >
                                                {formatDate(workshop.date)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TimeIcon sx={{ color: '#FF8E53', fontSize: isMobile ? 18 : 20 }} />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: '"Fredoka One", Arial, sans-serif',
                                                    color: '#666',
                                                    fontSize: isMobile ? 14 : 16
                                                }}
                                            >
                                                {formatTime(workshop.time)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Информация о школе и классе */}
                                    <Box sx={{ marginBottom: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                                            <SchoolIcon sx={{ color: '#4ECDC4', fontSize: isMobile ? 18 : 20 }} />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: '"Fredoka One", Arial, sans-serif',
                                                    color: '#666',
                                                    fontSize: isMobile ? 14 : 16
                                                }}
                                            >
                                                {workshop.school?.name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ClassIcon sx={{ color: '#45B7D1', fontSize: isMobile ? 18 : 20 }} />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: '"Fredoka One", Arial, sans-serif',
                                                    color: '#666',
                                                    fontSize: isMobile ? 14 : 16
                                                }}
                                            >
                                                {workshop.class?.name}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Участники */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        marginBottom: 2
                                    }}>
                                        <GroupIcon sx={{ color: '#96CEB4', fontSize: isMobile ? 18 : 20 }} />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                                color: '#666',
                                                fontSize: isMobile ? 14 : 16
                                            }}
                                        >
                                            {workshop.totalParticipants || 0} участников
                                        </Typography>
                                    </Box>

                                    {/* Статус */}
                                    <Box sx={{ marginBottom: 3 }}>
                                        <Chip
                                            label={workshop.status === 'scheduled' ? 'Запланирован' : workshop.status}
                                            sx={{
                                                background: '#FF6B9D',
                                                color: '#fff',
                                                fontFamily: '"Fredoka One", Arial, sans-serif',
                                                fontSize: isMobile ? 12 : 14,
                                                fontWeight: 'bold'
                                            }}
                                            icon={<TrophyIcon />}
                                        />
                                    </Box>

                                    {/* Кнопка записи/редактирования */}
                                    {isRegistered && childOrder ? (
                                        <Button
                                            variant="outlined"
                                            color="success"
                                            fullWidth
                                            data-workshop-id={workshop.id}
                                            onClick={() => onEditOrder && onEditOrder(workshop, childOrder)}
                                            sx={{
                                                background: 'linear-gradient(45deg, #C8E6C9 30%, #A5D6A7 90%)',
                                                borderRadius: 3,
                                                fontFamily: 'Fredoka One, Arial, sans-serif',
                                                fontSize: isMobile ? 16 : 18,
                                                fontWeight: 'bold',
                                                textTransform: 'none',
                                                padding: isMobile ? '10px' : '12px',
                                                boxShadow: '0 4px 16px rgba(76, 175, 80, 0.18)',
                                                color: '#388E3C',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #A5D6A7 30%, #C8E6C9 90%)',
                                                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.25)',
                                                    transform: 'translateY(-2px)'
                                                },
                                                '&:active': {
                                                    transform: 'translateY(0px) scale(0.98)'
                                                }
                                            }}
                                        >
                                            Уже записан
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            data-workshop-id={workshop.id}
                                            onClick={() => handleSignUpClick(workshop.id)}
                                            sx={{
                                                background: 'linear-gradient(45deg, #FF6B9D 30%, #FF8E53 90%)',
                                                borderRadius: 3,
                                                fontFamily: 'Fredoka One, Arial, sans-serif',
                                                fontSize: isMobile ? 16 : 18,
                                                fontWeight: 'bold',
                                                textTransform: 'none',
                                                padding: isMobile ? '10px' : '12px',
                                                boxShadow: '0 4px 16px rgba(255, 107, 157, 0.3)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B9D 90%)',
                                                    boxShadow: '0 6px 20px rgba(255, 107, 157, 0.4)',
                                                    transform: 'translateY(-2px)'
                                                },
                                                '&:active': {
                                                    transform: 'translateY(0px) scale(0.98)'
                                                }
                                            }}
                                        >
                                            Записаться! 🎨
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </Grow>
                    );
                })}
            </Box>

            {/* CSS анимации через sx */}
            <Box sx={{
                '@keyframes bounce': {
                    '0%, 20%, 50%, 80%, 100%': {
                        transform: 'translateY(0)',
                    },
                    '40%': {
                        transform: 'translateY(-10px)',
                    },
                    '60%': {
                        transform: 'translateY(-5px)',
                    },
                },
                '@keyframes pulse': {
                    '0%': {
                        transform: 'scale(1)',
                    },
                    '50%': {
                        transform: 'scale(1.05)',
                    },
                    '100%': {
                        transform: 'scale(1)',
                    },
                },
            }} />
        </Box>
    );
};

export default ChildWorkshopsList; 