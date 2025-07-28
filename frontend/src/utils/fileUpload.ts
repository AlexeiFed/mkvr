/**
 * @file: fileUpload.ts
 * @description: Утилиты для загрузки файлов
 * @dependencies: none
 * @created: 2024-07-07
 */

export interface FileUploadResult {
    file: File;
    preview: string;
    name: string;
    size: number;
    type: string;
}

export const createFileInput = (accept: string, multiple: boolean = false): HTMLInputElement => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';
    return input;
};

export const handleFileSelect = (files: FileList, maxSize: number = 5 * 1024 * 1024): FileUploadResult[] => {
    const results: FileUploadResult[] = [];

    Array.from(files).forEach(file => {
        if (file.size > maxSize) {
            throw new Error(`Файл ${file.name} слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`);
        }

        const preview = URL.createObjectURL(file);
        results.push({
            file,
            preview,
            name: file.name,
            size: file.size,
            type: file.type
        });
    });

    return results;
};

export const uploadFileToServer = async (file: File, endpoint: string, token: string): Promise<string> => {
    const formData = new FormData();

    // Определяем имя поля в зависимости от типа загрузки
    let fieldName = 'file';
    if (endpoint.includes('/photo')) {
        fieldName = 'files';
    } else if (endpoint.includes('/avatar')) {
        fieldName = 'file';
    } else if (endpoint.includes('/video')) {
        fieldName = 'file';
    }

    formData.append(fieldName, file);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки файла');
    }

    const result = await response.json();
    return result.url || result.path;
};

export const uploadPhotosToServer = async (files: File[], endpoint: string, token: string): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки файлов');
    }
    const result = await response.json();
    // result.files — массив объектов с url
    return Array.isArray(result.files) ? result.files.map((f: { url: string }) => f.url).filter(Boolean) : [];
};

export const cleanupFilePreview = (preview: string) => {
    URL.revokeObjectURL(preview);
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 