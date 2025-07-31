/**
 * @file: chatSlice.ts
 * @description: Redux slice для управления состоянием чата и push-уведомлений
 * @dependencies: @reduxjs/toolkit, types/index
 * @created: 2025-01-12
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Chat, Message, PushSubscription } from '../types';

// Async thunks
export const fetchConversations = createAsyncThunk(
    'chat/fetchConversations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/chat/conversations', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка получения чатов');
            }

            const data = await response.json();
            return data.chats;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка получения чатов');
        }
    }
);

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async (chatId: number, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/chat/${chatId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка получения сообщений');
            }

            const data = await response.json();
            return { chatId, messages: data.messages };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка получения сообщений');
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ chatId, content }: { chatId: number; content: string }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/chat/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error('Ошибка отправки сообщения');
            }

            const data = await response.json();
            return data.message;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка отправки сообщения');
        }
    }
);

export const startChat = createAsyncThunk(
    'chat/startChat',
    async (parentId: number, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/chat/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ parentId })
            });

            if (!response.ok) {
                throw new Error('Ошибка создания чата');
            }

            const data = await response.json();
            return data.chat;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка создания чата');
        }
    }
);

export const startChildChat = createAsyncThunk(
    'chat/startChildChat',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/chat/start-child', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка создания чата');
            }

            const data = await response.json();
            return data.chat;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка создания чата');
        }
    }
);

export const resetUnreadCount = createAsyncThunk(
    'chat/resetUnreadCount',
    async (chatId: number, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/chat/${chatId}/mark-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка сброса счетчика');
            }

            return { chatId };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка сброса счетчика');
        }
    }
);

export const subscribeToPush = createAsyncThunk(
    'chat/subscribeToPush',
    async (subscription: PushSubscription, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/chat/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(subscription)
            });

            if (!response.ok) {
                throw new Error('Ошибка подписки на уведомления');
            }

            return await response.json();
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка подписки на уведомления');
        }
    }
);

export const unsubscribeFromPush = createAsyncThunk(
    'chat/unsubscribeFromPush',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/chat/unsubscribe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка отписки от уведомлений');
            }

            return await response.json();
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка отписки от уведомлений');
        }
    }
);

export const sendMessageToAll = createAsyncThunk(
    'chat/sendMessageToAll',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const content = formData.get('content') as string;

            const response = await fetch('/api/chat/send-to-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error('Ошибка отправки сообщения всем');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Ошибка отправки сообщения всем');
        }
    }
);

// State interface
interface ChatState {
    conversations: Chat[];
    currentChat: Chat | null;
    messages: { [chatId: number]: Message[] };
    isLoading: boolean;
    error: string | null;
    isSending: boolean;
    pushSubscription: PushSubscription | null;
    isPushEnabled: boolean;
    unreadCount: number;
    unreadCounts: { [chatId: number]: number };
    scrollPositions: { [chatId: number]: number }; // Позиции скролла для каждого чата
}

// Initial state
const initialState: ChatState = {
    conversations: [],
    currentChat: null,
    messages: {},
    isLoading: false,
    error: null,
    isSending: false,
    pushSubscription: null,
    isPushEnabled: false,
    unreadCount: 0,
    unreadCounts: {},
    scrollPositions: {}
};

// Slice
const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
            state.currentChat = action.payload;
        },
        saveScrollPosition: (state, action: PayloadAction<{ chatId: number; position: number }>) => {
            state.scrollPositions[action.payload.chatId] = action.payload.position;
        },
        clearScrollPosition: (state, action: PayloadAction<number>) => {
            delete state.scrollPositions[action.payload];
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            const { chatId } = action.payload;
            if (!state.messages[chatId]) {
                state.messages[chatId] = [];
            }
            // Проверяем, что сообщение еще не добавлено (избегаем дублирования)
            const existingMessage = state.messages[chatId].find(m =>
                m.id === action.payload.id ||
                (m.content === action.payload.content &&
                    m.senderId === action.payload.senderId &&
                    Math.abs(new Date(m.timestamp).getTime() - new Date(action.payload.timestamp).getTime()) < 1000)
            );
            if (!existingMessage) {
                state.messages[chatId].push(action.payload);
            }
        },
        markChatAsRead: (state, action: PayloadAction<number>) => {
            const chatId = action.payload;
            const chatMessages = state.messages[chatId] || [];

            // Помечаем все сообщения в чате как прочитанные
            chatMessages.forEach(message => {
                message.isRead = true;
            });
        },
        updateUnreadCount: (state, action: PayloadAction<number>) => {
            state.unreadCount = action.payload;
        },
        updateConversation: (state, action: PayloadAction<Chat>) => {
            const index = state.conversations.findIndex(chat => chat.id === action.payload.id);
            if (index !== -1) {
                state.conversations[index] = action.payload;
            } else {
                state.conversations.unshift(action.payload);
            }
        },
        setPushSubscription: (state, action: PayloadAction<PushSubscription | null>) => {
            state.pushSubscription = action.payload;
            state.isPushEnabled = !!action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // fetchConversations
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.conversations = action.payload;
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // fetchMessages
        builder
            .addCase(fetchMessages.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.isLoading = false;
                const { chatId, messages } = action.payload;

                // Всегда добавляем только новые сообщения, не перезаписываем существующие
                if (!state.messages[chatId]) {
                    state.messages[chatId] = [];
                }

                messages.forEach((newMessage: Message) => {
                    const existingMessage = state.messages[chatId].find(m => m.id === newMessage.id);
                    if (!existingMessage) {
                        state.messages[chatId].push(newMessage);
                    }
                });

                // Убираем сортировку, которая может вызывать перезагрузку
                // state.messages[chatId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // sendMessage
        builder
            .addCase(sendMessage.pending, (state) => {
                state.error = null;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                const message = action.payload;
                if (!state.messages[message.chatId]) {
                    state.messages[message.chatId] = [];
                }

                // Проверяем, что сообщение еще не добавлено (избегаем дублирования)
                const existingMessage = state.messages[message.chatId].find(m =>
                    m.id === message.id ||
                    (m.content === message.content &&
                        m.senderId === message.senderId &&
                        Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000)
                );

                if (!existingMessage) {
                    state.messages[message.chatId].push(message);
                    // Убираем автоматическую сортировку, которая может вызывать перезагрузку
                    // state.messages[message.chatId].sort((a, b) =>
                    //     new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    // );
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // startChat
        builder
            .addCase(startChat.fulfilled, (state, action) => {
                const newChat = action.payload;
                const existingIndex = state.conversations.findIndex(chat => chat.id === newChat.id);
                if (existingIndex !== -1) {
                    state.conversations[existingIndex] = newChat;
                } else {
                    state.conversations.unshift(newChat);
                }
                state.currentChat = newChat;
            });

        // startChildChat
        builder
            .addCase(startChildChat.fulfilled, (state, action) => {
                const newChat = action.payload;
                const existingIndex = state.conversations.findIndex(chat => chat.id === newChat.id);
                if (existingIndex !== -1) {
                    state.conversations[existingIndex] = newChat;
                } else {
                    state.conversations.unshift(newChat);
                }
                state.currentChat = newChat;
            });

        // sendMessageToAll
        builder
            .addCase(sendMessageToAll.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(sendMessageToAll.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(sendMessageToAll.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // subscribeToPush
        builder
            .addCase(subscribeToPush.fulfilled, (state) => {
                state.isPushEnabled = true;
            });

        // unsubscribeFromPush
        builder
            .addCase(unsubscribeFromPush.fulfilled, (state) => {
                state.isPushEnabled = false;
                state.pushSubscription = null;
            });

        // resetUnreadCount
        builder
            .addCase(resetUnreadCount.fulfilled, (state, action) => {
                const { chatId } = action.payload;
                // Помечаем все сообщения в чате как прочитанные
                if (state.messages[chatId]) {
                    state.messages[chatId].forEach(message => {
                        message.isRead = true;
                    });
                }
            });
    }
});

export const {
    setCurrentChat,
    addMessage,
    updateConversation,
    setPushSubscription,
    clearError,
    markChatAsRead,
    updateUnreadCount,
    saveScrollPosition,
    clearScrollPosition
} = chatSlice.actions;

export default chatSlice.reducer; 