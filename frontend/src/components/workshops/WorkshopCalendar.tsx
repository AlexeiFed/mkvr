/**
 * @file: WorkshopCalendar.tsx
 * @description: Компонент календаря для мастер-классов
 * @dependencies: React, MUI, types
 * @created: 2024-12-19
 */

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton
} from '@mui/material';
import type { Workshop } from '../../types';

interface WorkshopCalendarProps {
    workshops: Workshop[];
    onDateSelect: (date: Date) => void;
    compact?: boolean;
}

const WorkshopCalendar: React.FC<WorkshopCalendarProps> = ({
    workshops,
    onDateSelect,
    compact = false
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        // Исправлено: неделя начинается с понедельника
        let startingDay = firstDay.getDay();
        startingDay = startingDay === 0 ? 6 : startingDay - 1;
        return { daysInMonth, startingDay };
    };

    const hasWorkshopOnDate = (date: Date) => {
        return workshops.some(workshop => {
            const workshopDate = new Date(workshop.date);
            return workshopDate.toDateString() === date.toDateString();
        });
    };

    const getWorkshopsOnDate = (date: Date) => {
        return workshops.filter(workshop => {
            const workshopDate = new Date(workshop.date);
            return workshopDate.toDateString() === date.toDateString();
        });
    };

    const renderCalendar = () => {
        const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
        const days = [];

        // Пустые ячейки в начале месяца
        for (let i = 0; i < startingDay; i++) {
            days.push(<Box key={`empty-${i}`} sx={{ p: 1, minHeight: compact ? 40 : 60 }} />);
        }

        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const hasWorkshop = hasWorkshopOnDate(date);
            const workshopsOnDate = getWorkshopsOnDate(date);

            days.push(
                <Box
                    key={day}
                    sx={{
                        p: 1,
                        minHeight: compact ? 40 : 60,
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        backgroundColor: hasWorkshop ? '#e3f2fd' : 'transparent',
                        '&:hover': {
                            backgroundColor: hasWorkshop ? '#bbdefb' : '#f5f5f5',
                        },
                    }}
                    onClick={() => onDateSelect(date)}
                >
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {day}
                    </Typography>
                    {/* Если есть мастер-классы, показываем только цифру */}
                    {hasWorkshop && !compact && workshopsOnDate.length > 0 && (
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                            {workshopsOnDate.length}
                        </Typography>
                    )}
                </Box>
            );
        }

        return days;
    };

    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    if (compact) {
        return (
            <Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button size="small" onClick={prevMonth}>&lt;</Button>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Typography>
                    <Button size="small" onClick={nextMonth}>&gt;</Button>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                    {/* Дни недели */}
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                        <Box key={day} sx={{ p: 0.5, textAlign: 'center', fontWeight: 'bold' }}>
                            <Typography variant="caption">{day}</Typography>
                        </Box>
                    ))}

                    {/* Календарные дни */}
                    {renderCalendar().map((day, index) => (
                        <Box key={index}>
                            {day}
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <IconButton onClick={prevMonth} size="small">
                    &lt;
                </IconButton>
                <Typography variant="h6" component="div">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Typography>
                <IconButton onClick={nextMonth} size="small">
                    &gt;
                </IconButton>
            </Box>
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                        <Box key={day} sx={{ p: 1, textAlign: 'center', fontWeight: 'bold' }}>
                            <Typography variant="body2">{day}</Typography>
                        </Box>
                    ))}
                    {renderCalendar().map((day, index) => (
                        <Box key={index}>{day}</Box>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
};

export default WorkshopCalendar; 