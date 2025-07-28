/**
 * @file: ComplectationTableRow.tsx
 * @description: Строка таблицы комплектации для ServiceDetails
 * @dependencies: @mui/material, react
 * @created: 2024-07-07
 */

import React, { useState } from 'react';
import {
    TableRow,
    TableCell,
    IconButton,
    Collapse,
    Box,
    Typography,
    Chip,
    Card,
    CardContent,
} from '@mui/material';
import {
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import type { SubService } from '../../store/subServicesSlice';

interface ComplectationTableRowProps {
    complectation: SubService;
    onEdit: (complectation: SubService) => void;
    onDelete: (id: number) => void;
}

const ComplectationTableRow: React.FC<ComplectationTableRowProps> = ({
    complectation,
    onEdit,
    onDelete,
}) => {
    const [open, setOpen] = useState(false);

    // Проверка на undefined
    if (!complectation) {
        return null;
    }

    const handleEdit = () => {
        onEdit(complectation);
    };

    const handleDelete = () => {
        onDelete(complectation.id);
    };

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>{complectation.name}</TableCell>
                <TableCell>
                    {complectation.hasVariants ? (
                        <Chip
                            label={`${complectation.variants.length} вариантов`}
                            color="primary"
                            size="small"
                        />
                    ) : (
                        <Chip
                            label="Без вариантов"
                            color="default"
                            size="small"
                        />
                    )}
                </TableCell>
                <TableCell>{complectation.minAge} лет</TableCell>
                <TableCell>
                    <IconButton onClick={handleEdit} color="primary" size="small">
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={handleDelete} color="error" size="small">
                        <DeleteIcon />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Детали комплектации
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Описание:
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        {complectation.description || 'Описание отсутствует'}
                                    </Typography>

                                    <Typography variant="subtitle2" color="text.secondary">
                                        Минимальный возраст:
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        {complectation.minAge} лет
                                    </Typography>
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Варианты:
                                    </Typography>
                                    {complectation.hasVariants && complectation.variants.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {complectation.variants.map((variant) => (
                                                <Card key={variant.id} variant="outlined" sx={{ p: 1 }}>
                                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {variant.name}
                                                        </Typography>
                                                        {variant.description && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                {variant.description}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                                            {variant.price} ₽
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Варианты не настроены
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export default ComplectationTableRow; 