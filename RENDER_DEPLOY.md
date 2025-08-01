# Деплой на Render - Краткая инструкция

## Быстрый старт

### 1. Создание базы данных PostgreSQL
1. Войдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите "New +" → "PostgreSQL"
3. Настройте:
   - Name: `mkvr-database`
   - Database: `mkvr_db`
   - User: `mkvr_user`
   - Region: выберите ближайший
   - Plan: Free

### 2. Создание Web Service
1. Нажмите "New +" → "Web Service"
2. Подключите ваш GitHub репозиторий
3. Настройте:
   - Name: `mkvr-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### 3. Переменные окружения
Добавьте в Environment Variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://mkvr_user:password@host:5432/mkvr_db
JWT_SECRET=HE1uCtDBn2yzw3vmKH+rIqvlTcLdJLiqzOwEy5dQ2DE=
PORT=3001
```

**Где взять DATABASE_URL:**
- После создания PostgreSQL базы данных
- Render покажет Internal Database URL
- Скопируйте его в переменную DATABASE_URL

### 4. Проверка деплоя
- Health check: `https://your-app-name.onrender.com/api/health`
- API base: `https://your-app-name.onrender.com/api`

## Troubleshooting

### Ошибки TypeScript
- ✅ Исправлено: создан tsconfig.prod.json с упрощенными настройками
- ✅ Исправлено: добавлен .nvmrc для Node.js 18

### Ошибки базы данных
- Убедитесь, что DATABASE_URL правильный
- Проверьте подключение к базе данных
- Выполните миграции: `npx prisma migrate deploy`

### Ошибки CORS
- Добавьте CORS_ORIGIN в переменные окружения:
```
CORS_ORIGIN=https://your-username.github.io
``` 