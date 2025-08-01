# Многоэтапная сборка для бэкенда
FROM node:18-alpine AS base

# Установка зависимостей
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Сборка backend
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Продакшн образ
FROM base AS runner
WORKDIR /app

# Создание пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Копирование собранных файлов
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Копирование Prisma схемы и миграций
COPY prisma ./prisma/

# Установка прав доступа
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3001

# Запуск приложения
CMD ["node", "dist/index.js"] 