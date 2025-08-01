#!/bin/bash

# Скрипт для деплоя MKVR приложения
# Использование: ./deploy.sh [environment]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка аргументов
ENVIRONMENT=${1:-production}
log_info "Деплой в окружение: $ENVIRONMENT"

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker не установлен"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose не установлен"
    exit 1
fi

# Создание .env файла если не существует
if [ ! -f .env ]; then
    log_info "Создание .env файла..."
    cat > .env << EOF
# База данных
DATABASE_URL=postgresql://mkvr_user:mkvr_password@postgres:5432/mkvr_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS
CORS_ORIGIN=https://your-domain.com

# Порт
PORT=3001

# Окружение
NODE_ENV=production

# Redis
REDIS_URL=redis://redis:6379

# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
EOF
    log_success ".env файл создан"
fi

# Остановка существующих контейнеров
log_info "Остановка существующих контейнеров..."
docker-compose down --remove-orphans

# Очистка старых образов
log_info "Очистка старых образов..."
docker system prune -f

# Сборка образов
log_info "Сборка Docker образов..."
docker-compose build --no-cache

# Запуск сервисов
log_info "Запуск сервисов..."
docker-compose up -d

# Ожидание готовности базы данных
log_info "Ожидание готовности базы данных..."
sleep 10

# Выполнение миграций
log_info "Выполнение миграций базы данных..."
docker-compose exec app npx prisma migrate deploy

# Генерация Prisma клиента
log_info "Генерация Prisma клиента..."
docker-compose exec app npx prisma generate

# Проверка статуса сервисов
log_info "Проверка статуса сервисов..."
docker-compose ps

# Проверка логов
log_info "Проверка логов приложения..."
docker-compose logs app --tail=20

log_success "Деплой завершен успешно!"
log_info "Приложение доступно по адресу: http://localhost"
log_info "API доступен по адресу: http://localhost/api"
log_warning "Не забудьте настроить SSL сертификаты для продакшена" 