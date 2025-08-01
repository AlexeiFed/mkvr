# Многоэтапная сборка для оптимизации размера
FROM node:18-alpine AS base

# Установка зависимостей
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
RUN npm ci --only=production

# Сборка frontend
FROM base AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# Сборка backend
FROM base AS backend-builder
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend
COPY backend/ ./backend/
RUN npm run build --prefix backend

# Продакшн образ
FROM base AS runner
WORKDIR /app

# Создание пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копирование собранных файлов
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/

# Копирование Prisma схемы и миграций
COPY backend/prisma ./backend/prisma/

# Установка прав доступа
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3001

# Запуск приложения
CMD ["node", "backend/dist/index.js"] 