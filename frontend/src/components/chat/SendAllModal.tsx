/**
 * @file: SendAllModal.tsx
 * @description: Модальное окно для отправки сообщений всем пользователям
 * @dependencies: React, Material-UI, Redux
 * @created: 2025-01-12
 */

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Close,
    Image,
    Send
} from '@mui/icons-material';
import { sendMessageToAll } from '../../store/chatSlice';
import type { AppDispatch } from '../../store';

interface SendAllModalProps {
    open: boolean;
    onClose: () => void;
}

const SendAllModal: React.FC<SendAllModalProps> = ({ open, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [message, setMessage] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Размер файла не должен превышать 5MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                setError('Пожалуйста, выберите изображение');
                return;
            }

            setImage(file);
            setError('');

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview('');
    };

    const handleSend = async () => {
        if (!message.trim() && !image) {
            setError('Введите сообщение или добавьте изображение');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('content', message);
            if (image) {
                formData.append('image', image);
            }

            await dispatch(sendMessageToAll(formData));
            setMessage('');
            setImage(null);
            setImagePreview('');
            onClose();
        } catch {
            setError('Ошибка отправки сообщения');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setMessage('');
            setImage(null);
            setImagePreview('');
            setError('');
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        📢 Отправить всем пользователям
                    </Typography>
                    <IconButton onClick={handleClose} disabled={isLoading}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Введите сообщение для всех пользователей..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <Box sx={{ mb: 2 }}>
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="image-upload"
                        type="file"
                        onChange={handleImageChange}
                    />
                    <label htmlFor="image-upload">
                        <Button
                            variant="outlined"
                            component="span"
                            startIcon={<Image />}
                            disabled={isLoading}
                        >
                            Добавить изображение
                        </Button>
                    </label>
                </Box>

                {imagePreview && (
                    <Box sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle2">Предварительный просмотр:</Typography>
                            <IconButton
                                size="small"
                                onClick={handleRemoveImage}
                                disabled={isLoading}
                            >
                                <Close />
                            </IconButton>
                        </Box>
                        <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: 200,
                                borderRadius: 8
                            }}
                        />
                    </Box>
                )}

                <Alert severity="info">
                    <Typography variant="body2">
                        Это сообщение будет отправлено всем активным пользователям системы.
                        Используйте для важных объявлений и рекламы.
                    </Typography>
                </Alert>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={isLoading}>
                    Отмена
                </Button>
                <Button
                    onClick={handleSend}
                    variant="contained"
                    startIcon={isLoading ? <CircularProgress size={16} /> : <Send />}
                    disabled={isLoading || (!message.trim() && !image)}
                >
                    {isLoading ? 'Отправка...' : 'Отправить всем'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendAllModal; 