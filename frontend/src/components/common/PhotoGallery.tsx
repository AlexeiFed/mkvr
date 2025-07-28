/**
 * @file: PhotoGallery.tsx
 * @description: Компонент для отображения галереи фотографий с возможностью редактирования
 * @dependencies: @mui/material, @mui/icons-material
 * @created: 2024-07-07
 */

import React from 'react';
import {
    Box,
    Card,
    CardMedia,
    IconButton,
    Typography,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface PhotoGalleryProps {
    photos: (File | string)[];
    onEdit: (index: number, file: File | string) => void;
    onDelete: (index: number) => void;
    disabled?: boolean;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
    photos,
    onEdit,
    onDelete,
    disabled = false,
}) => {
    const getPhotoUrl = (photo: File | string): string => {
        if (typeof photo === 'string') {
            return photo || '';
        }
        return URL.createObjectURL(photo);
    };

    if (photos.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Фотографии не загружены
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {photos.map((photo, index) => (
                <Box key={index}>
                    <Card
                        sx={{
                            position: 'relative',
                            height: 280,
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                        }}
                    >
                        <CardMedia
                            component="img"
                            image={getPhotoUrl(photo) || undefined}
                            alt={`Фото ${index + 1}`}
                            sx={{
                                height: 200,
                                objectFit: 'cover',
                            }}
                        />
                        <Box sx={{
                            p: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flex: 1
                        }}>
                            <Typography variant="caption" color="text.secondary">
                                Фото {index + 1}
                            </Typography>
                            <Box>
                                <IconButton
                                    size="small"
                                    onClick={() => onEdit(index, photo)}
                                    disabled={disabled}
                                    sx={{ mr: 0.5 }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => onDelete(index)}
                                    disabled={disabled}
                                    color="error"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    </Card>
                </Box>
            ))}
        </Box>
    );
};

export default PhotoGallery; 