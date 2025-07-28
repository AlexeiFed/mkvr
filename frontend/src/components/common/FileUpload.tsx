/**
 * @file: FileUpload.tsx
 * @description: Компонент для загрузки файлов с предпросмотром
 * @dependencies: react, @mui/material, fileUpload utils
 * @created: 2024-07-07
 */

import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Typography,
    IconButton,
    Card,
    CardMedia,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { handleFileSelect, cleanupFilePreview, formatFileSize } from '../../utils/fileUpload';
import type { FileUploadResult } from '../../utils/fileUpload';

interface FileUploadProps {
    accept: string;
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number;
    label?: string;
    value?: string[];
    onChange: (urls: string[]) => void;
    onFilesChange?: (files: File[]) => void;
    disabled?: boolean;
    isLoading?: boolean;
    hidePreview?: boolean; // Добавлено
}

const FileUpload: React.FC<FileUploadProps> = ({
    accept,
    multiple = false,
    maxFiles = 5,
    maxSize = 5 * 1024 * 1024, // 5MB
    label = 'Загрузить файлы',
    value = [],
    onChange,
    onFilesChange,
    disabled = false,
    isLoading = false,
    hidePreview = false,
}) => {
    const [uploadedFiles, setUploadedFiles] = useState<FileUploadResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);



    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log('FileUpload handleFileInputChange called');
        console.log('event.target.files:', event.target.files);

        const files = event.target.files;
        if (!files) {
            console.log('No files selected');
            return;
        }

        console.log('Files selected:', files.length);

        try {
            setError(null);

            if (uploadedFiles.length + files.length > maxFiles) {
                throw new Error(`Максимальное количество файлов: ${maxFiles}`);
            }

            const newFiles = handleFileSelect(files, maxSize);
            console.log('New files processed:', newFiles);
            setUploadedFiles(prev => [...prev, ...newFiles]);

            if (onFilesChange) {
                console.log('Calling onFilesChange with files:', [...uploadedFiles, ...newFiles].map(f => f.file));
                onFilesChange([...uploadedFiles, ...newFiles].map(f => f.file));
            }
        } catch (err) {
            console.error('Error in handleFileInputChange:', err);
            setError(err instanceof Error ? err.message : 'Ошибка при выборе файлов');
        }

        // Сброс input для возможности повторного выбора тех же файлов
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        const fileToRemove = uploadedFiles[index];
        cleanupFilePreview(fileToRemove.preview);

        const newFiles = uploadedFiles.filter((_, i) => i !== index);
        setUploadedFiles(newFiles);

        if (onFilesChange) {
            onFilesChange(newFiles.map(f => f.file));
        }
    };

    const handleRemoveUrl = (index: number) => {
        const newUrls = value.filter((_, i) => i !== index);
        onChange(newUrls);
    };

    const isImage = (type: string) => type.startsWith('image/');

    const renderFilePreview = (file: FileUploadResult, index: number) => (
        <Card key={index} sx={{ width: 200, m: 1 }}>
            <CardMedia
                component={isImage(file.type) ? 'img' : 'video'}
                height="140"
                image={file.preview}
                src={file.preview}
                alt={file.name}
                sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ p: 1 }}>
                <Typography variant="caption" noWrap>
                    {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                    {formatFileSize(file.size)}
                </Typography>
                <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFile(index)}
                    sx={{ mt: 0.5 }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </CardContent>
        </Card>
    );

    const renderUrlPreview = (url: string, index: number) => (
        <Card key={index} sx={{ width: 200, m: 1 }}>
            <CardMedia
                component="img"
                height="140"
                image={url}
                alt={`Файл ${index + 1}`}
                sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ p: 1 }}>
                <Typography variant="caption" noWrap>
                    Файл {index + 1}
                </Typography>
                <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveUrl(index)}
                    sx={{ mt: 0.5 }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInputChange}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 1,
                        fontSize: '0'
                    }}
                    disabled={disabled || isLoading}
                />

                <Button
                    variant="outlined"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    disabled={disabled || isLoading}
                    sx={{ mb: 2, position: 'relative', zIndex: 0 }}
                >
                    {label}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!hidePreview && (
                <Box display="flex" flexWrap="wrap" gap={1}>
                    {/* Существующие URL */}
                    {value.map((url, index) => renderUrlPreview(url, index))}

                    {/* Загруженные файлы */}
                    {uploadedFiles.map((file, index) => renderFilePreview(file, index))}
                </Box>
            )}

            {!hidePreview && (value.length > 0 || uploadedFiles.length > 0) && (
                <Box mt={2}>
                    <Chip
                        label={`Всего файлов: ${value.length + uploadedFiles.length}`}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            )}
        </Box>
    );
};

export default FileUpload; 