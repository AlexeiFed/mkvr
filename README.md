# MKVR - PWA-приложение "Восковые ручки"

Progressive Web Application для организации мастер-классов по изготовлению восковых ручек в школах и детских садах.

## 🎯 Описание проекта

Приложение позволяет:
- Организовать удаленную запись на мастер-классы
- Осуществлять оплату услуг
- Управлять заказами и статистикой
- Обеспечить взаимодействие между организаторами, родителями и детьми

## 🏗️ Архитектура

- **Frontend**: React 18+ + TypeScript + Material-UI + PWA
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma/TypeORM
- **Уведомления**: Email + SMS + Push notifications
- **Чат**: WebSocket для общения родителей с администраторами

## 📁 Структура проекта

```
MKVR/
├── frontend/          # React приложение
├── backend/           # Node.js API
├── shared/            # Общие типы и утилиты
├── docs/              # Документация
├── scripts/           # Скрипты развертывания
└── package.json       # Корневой package.json
```

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm 9+
- PostgreSQL 14+

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd MKVR
```

2. Установите зависимости:
```bash
npm run install:all
```

3. Настройте переменные окружения:
```bash
# Скопируйте примеры конфигураций
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Настройте базу данных:
```bash
# Создайте базу данных PostgreSQL
createdb mkvr_app

# Запустите миграции
npm run migrate --workspace=backend
```

5. Запустите проект:
```bash
# Разработка (frontend + backend)
npm run dev

# Или отдельно
npm run dev:frontend
npm run dev:backend
```

## 📚 Документация

- [Project.md](docs/Project.md) - Детальное описание архитектуры
- [Tasktracker.md](docs/Tasktracker.md) - Отслеживание задач
- [Diary.md](docs/Diary.md) - Технический дневник
- [qa.md](docs/qa.md) - Вопросы и ответы по архитектуре

## 🛠️ Доступные скрипты

### Корневые команды
- `npm run dev` - Запуск frontend и backend в режиме разработки
- `npm run build` - Сборка всех проектов
- `npm run test` - Запуск тестов
- `npm run lint` - Проверка кода линтером
- `npm run format` - Форматирование кода

### Frontend
- `npm run dev:frontend` - Запуск React приложения
- `npm run build:frontend` - Сборка frontend

### Backend
- `npm run dev:backend` - Запуск Node.js API
- `npm run build:backend` - Сборка backend

## 🔧 Разработка

### Code Style
- ESLint + Prettier
- TypeScript strict mode
- Conventional Commits

### Тестирование
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)

### Безопасность
- JWT аутентификация
- Ролевая модель доступа (RBAC)
- Защита от SQL injection
- XSS и CSRF защита

## 📱 PWA функции

- Установка на устройство
- Офлайн функционал
- Push уведомления
- Service Worker кэширование

## 🤝 Роли пользователей

- **Администратор**: Управление системой, пользователями, статистика
- **Исполнитель**: Просмотр списков участников, отметки о выполнении
- **Родитель**: Регистрация детей, запись на мастер-классы, оплата
- **Ребенок**: Просмотр информации, запись на мероприятия

## 📄 Лицензия

MIT License

## 👥 Команда

- **Системный архитектор**: Алексей
- **Разработчики**: MKVR Team

---

**Версия**: 1.0.0  
**Дата**: 2024-07-06 