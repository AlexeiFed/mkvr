/**
 * @file: ImageCropper.tsx
 * @description: Компонент для обрезки изображений
 * @dependencies: react-image-crop, @mui/material
 * @created: 2024-07-07
 */

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Slider,
} from '@mui/material';

interface ImageCropperProps {
    open: boolean;
    imageSrc: string;
    onClose: () => void;
    onCrop: (croppedImage: Blob) => void;
    aspectRatio?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
    open,
    imageSrc,
    onClose,
    onCrop,
    aspectRatio = 1,
}) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const imgRef = useRef<HTMLImageElement>(null);

    const onSelectCrop = useCallback((crop: Crop) => {
        setCrop(crop);
    }, []);

    const onCropComplete = useCallback((crop: PixelCrop) => {
        setCompletedCrop(crop);
    }, []);

    const centerAspectCrop = useCallback(
        (mediaWidth: number, mediaHeight: number, aspect: number) => {
            return centerCrop(
                makeAspectCrop(
                    {
                        unit: '%',
                        width: 90,
                    },
                    aspect,
                    mediaWidth,
                    mediaHeight,
                ),
                mediaWidth,
                mediaHeight,
            );
        },
        [],
    );

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        if (aspectRatio) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspectRatio));
        }
    }, [aspectRatio, centerAspectCrop]);

    const getCroppedImg = useCallback(async (): Promise<Blob> => {
        if (!imgRef.current || !completedCrop) {
            throw new Error('No image or crop data');
        }

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;

        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width,
            completedCrop.height,
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                }
            }, 'image/jpeg', 0.9);
        });
    }, [completedCrop]);

    const handleCrop = async () => {
        try {
            const croppedImage = await getCroppedImg();
            onCrop(croppedImage);
            onClose();
        } catch (error) {
            console.error('Ошибка при обрезке изображения:', error);
        }
    };

    const handleClose = () => {
        setCrop(undefined);
        setCompletedCrop(undefined);
        setScale(1);
        setRotate(0);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Обрезка изображения
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Масштаб
                    </Typography>
                    <Slider
                        value={scale}
                        onChange={(_, value) => setScale(value as number)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        marks={[
                            { value: 0.5, label: '50%' },
                            { value: 1, label: '100%' },
                            { value: 2, label: '200%' },
                        ]}
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Поворот
                    </Typography>
                    <Slider
                        value={rotate}
                        onChange={(_, value) => setRotate(value as number)}
                        min={-180}
                        max={180}
                        step={15}
                        marks={[
                            { value: -180, label: '-180°' },
                            { value: 0, label: '0°' },
                            { value: 180, label: '180°' },
                        ]}
                    />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <ReactCrop
                        crop={crop}
                        onChange={onSelectCrop}
                        onComplete={onCropComplete}
                        aspect={aspectRatio}
                        minWidth={50}
                        minHeight={50}
                    >
                        <img
                            ref={imgRef}
                            alt="Обрезка"
                            src={imageSrc}
                            style={{
                                transform: `scale(${scale}) rotate(${rotate}deg)`,
                                maxWidth: '100%',
                                maxHeight: '400px',
                            }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                </Box>

                <Typography variant="caption" color="text.secondary">
                    Перетащите область для обрезки. Используйте ползунки для масштабирования и поворота.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Отмена</Button>
                <Button
                    onClick={handleCrop}
                    variant="contained"
                    disabled={!completedCrop}
                >
                    Обрезать
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImageCropper; 