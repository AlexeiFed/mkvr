# Настройка Production окружения на Render

## Проблемы с Production

### Выявленные проблемы:
1. **Ошибки 500 на API endpoints** (`/schools`, `/auth/login`)
2. **Отсутствие переменной DATABASE_URL** в Render
3. **Проблемы с подключением к базе данных**

### Диагностика

Добавлено логирование для диагностики:
- Проверка переменных окружения
- Логирование ошибок подключения к БД
- Детальная информация об ошибках

### Необходимые действия:

#### 1. Настройка переменных окружения в Render

В панели управления Render добавить:

```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=mkvr-super-secret-jwt-key-2024-production
NODE_ENV=production
CORS_ORIGIN=https://alexeifed.github.io
PORT=3001
```

#### 2. Проверка базы данных

Убедиться, что:
- База данных PostgreSQL создана на Render
- Переменная DATABASE_URL корректна
- Prisma может подключиться к БД

#### 3. Миграции базы данных

Выполнить миграции в production:
```bash
npx prisma migrate deploy
```

#### 4. Генерация Prisma Client

```bash
npx prisma generate
```

### Мониторинг

После настройки проверить:
- Логи в Render Dashboard
- Health check endpoint
- API endpoints

### Команды для диагностики

```bash
# Проверка health
curl https://mkvr-backend.onrender.com/api/health

# Проверка школ
curl https://mkvr-backend.onrender.com/api/schools

# Проверка аутентификации
curl -X POST https://mkvr-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Статус исправлений:
- ✅ Добавлена диагностика
- ✅ Улучшено логирование
- ⚠️ Требуется настройка переменных окружения в Render
- ⚠️ Требуется проверка подключения к БД 