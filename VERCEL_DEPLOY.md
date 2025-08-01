# Деплой MKVR на Vercel

## 🚀 Быстрый старт

### 1. Подготовка проекта

```bash
# Убедитесь, что у вас установлен Vercel CLI
npm i -g vercel

# Войдите в аккаунт Vercel
vercel login
```

### 2. Настройка базы данных

#### Вариант A: Vercel Postgres (Рекомендуется)

1. **Создайте базу данных в Vercel Dashboard:**
   - Перейдите в [Vercel Dashboard](https://vercel.com/dashboard)
   - Выберите ваш проект
   - Перейдите в раздел "Storage"
   - Создайте новую Postgres базу данных

2. **Получите строку подключения:**
   - Скопируйте DATABASE_URL из настроек базы данных
   - Добавьте её в переменные окружения проекта

#### Вариант B: Внешняя база данных

Используйте любую PostgreSQL базу данных:
- Supabase
- PlanetScale
- Railway
- Neon
- AWS RDS

### 3. Настройка переменных окружения

В Vercel Dashboard добавьте следующие переменные:

```env
# База данных
DATABASE_URL=postgresql://username:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS
CORS_ORIGIN=https://your-domain.vercel.app

# Окружение
NODE_ENV=production

# Push Notifications (опционально)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### 4. Деплой

```bash
# Деплой на Vercel
vercel --prod

# Или через Git
git push origin main
```

## 📁 Структура для Vercel

```
MKVR/
├── vercel.json          # Конфигурация Vercel
├── package.json         # Корневой package.json
├── frontend/            # React приложение
├── backend/             # Node.js API
│   ├── src/
│   ├── prisma/
│   └── vercel.js        # Адаптер для Vercel
└── docs/                # Документация
```

## ⚙️ Конфигурация

### vercel.json

```json
{
  "version": 2,
  "name": "mkvr-app",
  "builds": [
    {
      "src": "backend/dist/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/dist/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ]
}
```

### package.json

```json
{
  "scripts": {
    "vercel-build": "npm run build:frontend && npm run build:backend"
  }
}
```

## 🔧 Настройка базы данных

### 1. Миграции

```bash
# Локально
npx prisma migrate dev

# На Vercel (через переменные окружения)
npx prisma migrate deploy
```

### 2. Генерация Prisma клиента

```bash
# Добавьте в vercel-build скрипт
npx prisma generate
```

## 🌐 Домены и SSL

### Автоматический SSL
Vercel автоматически предоставляет SSL сертификаты для всех доменов.

### Кастомный домен
1. В Vercel Dashboard перейдите в "Settings" → "Domains"
2. Добавьте ваш домен
3. Настройте DNS записи согласно инструкциям

## 📊 Мониторинг

### Логи
- **Vercel Dashboard** → "Functions" → выберите функцию → "Logs"
- **Vercel CLI**: `vercel logs`

### Метрики
- **Vercel Dashboard** → "Analytics"
- **Функции**: "Functions" → "Usage"

## 🔒 Безопасность

### Переменные окружения
- Все секретные данные храните в переменных окружения
- Никогда не коммитьте `.env` файлы

### CORS
```javascript
// В backend/src/index.ts
const corsOrigins = isVercel 
    ? [process.env['CORS_ORIGIN'] || 'https://your-domain.vercel.app']
    : ['http://localhost:5173', 'http://localhost:5174'];
```

## 🚨 Ограничения Vercel

### Serverless функции
- **Таймаут**: 10 секунд (Hobby), 60 секунд (Pro)
- **Размер**: 50MB (Hobby), 300MB (Pro)
- **Память**: 1024MB

### WebSocket
- Vercel не поддерживает WebSocket в serverless функциях
- Используйте внешние сервисы: Pusher, Ably, Socket.io Cloud

### Файлы
- Vercel не поддерживает постоянное хранение файлов
- Используйте: AWS S3, Cloudinary, Vercel Blob Storage

## 🔄 Обновления

### Автоматический деплой
```bash
# При push в main ветку
git push origin main

# Или вручную
vercel --prod
```

### Откат
```bash
# Откат к предыдущей версии
vercel rollback
```

## 🛠️ Устранение неполадок

### Проблемы с базой данных
```bash
# Проверка подключения
curl https://your-domain.vercel.app/api/test-db

# Логи
vercel logs --follow
```

### Проблемы с сборкой
```bash
# Локальная сборка
npm run vercel-build

# Проверка конфигурации
vercel --debug
```

### Проблемы с CORS
```javascript
// Убедитесь, что CORS_ORIGIN настроен правильно
console.log('CORS Origin:', process.env['CORS_ORIGIN']);
```

## 💰 Стоимость

### Hobby план (Бесплатный)
- 100GB bandwidth
- 100GB storage
- 100GB function execution
- 100GB database storage

### Pro план ($20/месяц)
- 1TB bandwidth
- 1TB storage
- 1TB function execution
- 256GB database storage

## 📞 Поддержка

### Vercel Support
- [Документация Vercel](https://vercel.com/docs)
- [Discord Community](https://discord.gg/vercel)
- [GitHub Issues](https://github.com/vercel/vercel)

### Полезные команды
```bash
# Информация о проекте
vercel ls

# Переменные окружения
vercel env ls

# Логи в реальном времени
vercel logs --follow

# Перезапуск функций
vercel --prod
```

## 🎯 Рекомендации

1. **Используйте Vercel Postgres** для простоты
2. **Настройте автоматический деплой** из Git
3. **Мониторьте логи** для отладки
4. **Используйте Preview Deployments** для тестирования
5. **Настройте кастомный домен** для продакшена

---

**Готово!** 🚀 Ваше приложение MKVR теперь работает на Vercel! 