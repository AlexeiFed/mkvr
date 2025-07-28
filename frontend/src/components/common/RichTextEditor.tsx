/**
 * @file: RichTextEditor.tsx
 * @description: Компонент для редактирования текста с форматированием (tiptap)
 * @dependencies: @tiptap/react, @tiptap/starter-kit, @mui/material
 * @created: 2024-07-07
 */

import React, { useEffect } from 'react';
import { Box, Typography, IconButton, ButtonGroup, Tooltip } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    helperText?: string;
    minRows?: number;
    maxRows?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    label,
    placeholder,
    disabled = false,
    error = false,
    helperText,
    minRows = 4,
    maxRows = 20,
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                placeholder: placeholder || '',
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '<p></p>');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
        <Box>
            {label && (
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{label}</Typography>
            )}
            <ButtonGroup size="small" sx={{ mb: 1 }}>
                <Tooltip title="Жирный"><IconButton onClick={() => editor?.chain().focus().toggleBold().run()} disabled={disabled}><FormatBoldIcon color={editor?.isActive('bold') ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="Курсив"><IconButton onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={disabled}><FormatItalicIcon color={editor?.isActive('italic') ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="Подчеркнутый"><IconButton onClick={() => editor?.chain().focus().toggleUnderline().run()} disabled={disabled}><FormatUnderlinedIcon color={editor?.isActive('underline') ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="Маркированный список"><IconButton onClick={() => editor?.chain().focus().toggleBulletList().run()} disabled={disabled}><FormatListBulletedIcon color={editor?.isActive('bulletList') ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="Нумерованный список"><IconButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} disabled={disabled}><FormatListNumberedIcon color={editor?.isActive('orderedList') ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="Цитата"><IconButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} disabled={disabled}><FormatQuoteIcon color={editor?.isActive('blockquote') ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="Код"><IconButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} disabled={disabled}><CodeIcon color={editor?.isActive('codeBlock') ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="Выровнять влево"><IconButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} disabled={disabled}><FormatAlignLeftIcon color={editor?.isActive({ textAlign: 'left' }) ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="По центру"><IconButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} disabled={disabled}><FormatAlignCenterIcon color={editor?.isActive({ textAlign: 'center' }) ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="Выровнять вправо"><IconButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} disabled={disabled}><FormatAlignRightIcon color={editor?.isActive({ textAlign: 'right' }) ? 'primary' : 'inherit'} /></IconButton></Tooltip>
                <Tooltip title="По ширине"><IconButton onClick={() => editor?.chain().focus().setTextAlign('justify').run()} disabled={disabled}><FormatAlignJustifyIcon color={editor?.isActive({ textAlign: 'justify' }) ? 'primary' : 'inherit'} /></IconButton></Tooltip>
            </ButtonGroup>
            <Box sx={{ border: error ? '1px solid red' : '1px solid #ccc', borderRadius: 1, minHeight: minRows * 24, maxHeight: maxRows * 24, overflowY: 'auto', p: 1, mb: 1 }}>
                <EditorContent editor={editor} />
            </Box>
            {helperText && (
                <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
                    {helperText}
                </Typography>
            )}
        </Box>
    );
};

export default RichTextEditor; 