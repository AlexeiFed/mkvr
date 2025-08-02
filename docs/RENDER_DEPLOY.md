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

### Пошаговая настройка Render Dashboard

#### Шаг 1: Вход в Render Dashboard
1. Перейти на https://dashboard.render.com
2. Войти в аккаунт
3. Найти сервис `mkvr-backend`

#### Шаг 2: Настройка переменных окружения
1. Открыть сервис `mkvr-backend`
2. Перейти в раздел **Environment**
3. Добавить следующие переменные:

```
DATABASE_URL=postgresql://mkvr_user:siCW1xH9vwufTdUdvwwgUY8GIqg6BxsP@dpg-d26798muk2gs73bl4k0g-a/mkvr_db
JWT_SECRET=HE1uCtDBn2yzw3vmKH+rIqvlTcLdJLiqzOwEy5dQ2DE=
NODE_ENV=production
CORS_ORIGIN=https://alexeifed.github.io
PORT=3001
```

#### Шаг 3: Создание базы данных PostgreSQL
1. В Render Dashboard создать новый **PostgreSQL** сервис
2. Назвать `mkvr-database`
3. Скопировать **Internal Database URL**
4. Вставить в переменную `DATABASE_URL`

#### Шаг 4: Перезапуск сервиса
1. После настройки переменных нажать **Manual Deploy**
2. Дождаться завершения деплоя
3. Проверить логи на наличие ошибок

### Проверка подключения к базе данных

#### Команды для проверки:
```bash
# Проверка health endpoint
curl https://mkvr-backend.onrender.com/api/health

# Проверка API школ
curl https://mkvr-backend.onrender.com/api/schools

# Проверка аутентификации
curl -X POST https://mkvr-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Выполнение миграций

#### Автоматические миграции:
Render автоматически выполнит миграции при деплое, если в `package.json` есть:
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && tsc"
  }
}
```

#### Ручные миграции (если нужно):
1. Подключиться к серверу через SSH
2. Выполнить команды:
```bash
npx prisma generate
npx prisma migrate deploy
```

### Мониторинг и диагностика

#### Проверка логов:
1. В Render Dashboard открыть **Logs**
2. Искать ошибки подключения к БД
3. Проверить сообщения о переменных окружения

#### Ожидаемые логи при успешной настройке:
```
📋 Окружение: production
📋 DATABASE_URL: Настроен
✅ Найдено школ: X
```

### Статус исправлений:
- ✅ Добавлена диагностика
- ✅ Улучшено логирование
- ✅ Создана пошаговая инструкция
- ⚠️ Требуется настройка переменных окружения в Render
- ⚠️ Требуется создание PostgreSQL базы данных 