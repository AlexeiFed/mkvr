# MKVR - Восковые ручки

PWA-приложение для организации мастер-классов по изготовлению восковых ручек.

## 🚀 Быстрый старт

### Вариант 1: Docker (Локальная разработка)

#### Требования
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM минимум

#### Установка и запуск
```bash
# Клонирование репозитория
git clone <repository-url>
cd MKVR

# Автоматический деплой
./deploy.sh

# Или вручную
docker-compose up -d
```

#### Доступ к приложению
- **Frontend**: http://localhost
- **API**: http://localhost/api
- **База данных**: localhost:5432

### Вариант 2: Vercel (Продакшен)

#### Требования
- Vercel аккаунт
- Vercel CLI: `npm i -g vercel`

#### Быстрый деплой
```bash
# Установка Vercel CLI
npm i -g vercel

# Вход в аккаунт
vercel login

# Деплой
vercel --prod
```

#### Настройка базы данных
1. Создайте Vercel Postgres в Dashboard
2. Добавьте DATABASE_URL в переменные окружения
3. Настройте остальные переменные окружения

Подробная инструкция: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

## 📋 Возможности

### Для администраторов
- Управление школами и классами
- Создание и редактирование мастер-классов
- Управление услугами и комплектациями
- Просмотр статистики и отчетов
- Управление пользователями

### Для исполнителей
- Просмотр назначенных мастер-классов
- Детальная информация о участниках
- Статистика по комплектациям
- Push-уведомления о новых назначениях

### Для родителей
- Регистрация детей на мастер-классы
- Выбор комплектаций
- Просмотр расписания
- История участия

## 🏗️ Архитектура

```
Frontend (React + TypeScript + Vite)
    ↓
Nginx (Прокси + SSL)
    ↓
Backend (Node.js + Express + TypeScript)
    ↓
PostgreSQL (База данных)
Redis (Кэш)
```

## 🛠️ Технологии

### Frontend
- **React 19** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик
- **Material-UI** - компоненты
- **Redux Toolkit** - управление состоянием
- **React Router** - маршрутизация
- **Socket.IO** - WebSocket соединения

### Backend
- **Node.js** - серверная платформа
- **Express** - веб-фреймворк
- **TypeScript** - типизация
- **Prisma** - ORM для PostgreSQL
- **JWT** - аутентификация
- **Socket.IO** - WebSocket сервер
- **Web-Push** - push уведомления

### Инфраструктура
- **Docker** - контейнеризация
- **PostgreSQL** - база данных
- **Redis** - кэширование
- **Nginx** - прокси-сервер
- **SSL/TLS** - шифрование

## 📁 Структура проекта

```
MKVR/
├── frontend/          # React приложение
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы
│   │   ├── services/    # API сервисы
│   │   ├── store/       # Redux store
│   │   └── types/       # TypeScript типы
│   └── public/          # Статические файлы
├── backend/           # Node.js API
│   ├── src/
│   │   ├── controllers/ # Контроллеры
│   │   ├── routes/      # Маршруты
│   │   ├── middleware/  # Middleware
│   │   ├── services/    # Бизнес-логика
│   │   └── types/       # TypeScript типы
│   └── prisma/         # Схема базы данных
├── docs/              # Документация
├── docker-compose.yml # Docker Compose
├── Dockerfile         # Docker образ
├── nginx.conf         # Nginx конфигурация
├── deploy.sh          # Скрипт деплоя
└── DEPLOY.md          # Документация деплоя
```

## 🔧 Разработка

### Локальная разработка
```bash
# Установка зависимостей
npm run install:all

# Запуск в режиме разработки
npm run dev

# Сборка
npm run build

# Линтинг
npm run lint
```

### Структура базы данных
```sql
-- Основные таблицы
users          # Пользователи
schools        # Школы
classes        # Классы
services       # Услуги
sub_services   # Подуслуги
workshops      # Мастер-классы
orders         # Заказы
```

## 🔒 Безопасность

### Обязательные меры для продакшена:
1. **Измените все пароли по умолчанию**
2. **Настройте SSL сертификаты**
3. **Используйте сильный JWT_SECRET**
4. **Настройте файрвол**
5. **Регулярно обновляйте зависимости**

## 📊 Мониторинг

### Команды для мониторинга
```bash
# Статус сервисов
docker-compose ps

# Логи приложения
docker-compose logs app

# Мониторинг ресурсов
docker stats

# Проверка базы данных
docker-compose exec postgres psql -U mkvr_user -d mkvr_db
```

## 🚀 Деплой

Подробная документация по деплою находится в файле [DEPLOY.md](./DEPLOY.md).

### Быстрый деплой
```bash
# Автоматический деплой
./deploy.sh

# Проверка работы
curl http://localhost/api/health
```

## 📝 Документация

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Деплой на Vercel
- [DEPLOY.md](./DEPLOY.md) - Деплой с Docker
- [docs/Project.md](./docs/Project.md) - Архитектура проекта
- [docs/changelog.md](./docs/changelog.md) - История изменений
- [docs/Tasktracker.md](./docs/Tasktracker.md) - Отслеживание задач

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](./LICENSE) для подробностей.

## 📞 Поддержка

При возникновении проблем:
1. Проверьте [документацию](./docs/)
2. Изучите [логи](./docs/changelog.md)
3. Создайте Issue в репозитории

---

**MKVR Team** - Создано с ❤️ для организации мастер-классов 