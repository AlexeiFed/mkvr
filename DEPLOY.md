# Деплой проекта MKVR

## Бэкенд на Render

### 1. Подготовка
- Убедитесь, что у вас есть аккаунт на [Render](https://render.com)
- Создайте новую базу данных PostgreSQL на Render

### 2. Деплой бэкенда
1. Подключите ваш GitHub репозиторий к Render
2. Создайте новый Web Service
3. Настройте следующие параметры:
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

### 3. Переменные окружения
Добавьте следующие переменные в настройках Render:
```
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
PORT=3001
```

### 4. Health Check
Render будет использовать endpoint `/api/health` для проверки состояния сервиса.

## Фронтенд на GitHub Pages

### 1. Настройка GitHub Pages
1. Перейдите в Settings вашего репозитория
2. В разделе Pages выберите "GitHub Actions" как источник
3. Убедитесь, что workflow файл `.github/workflows/deploy.yml` присутствует

### 2. Автоматический деплой
При каждом push в ветку `main` будет автоматически запускаться сборка и деплой.

### 3. Настройка API URL
В файле `frontend/.env.production` указан URL бэкенда на Render:
```
VITE_API_URL=https://mkvr-backend.onrender.com/api
```

## Проверка деплоя

### Бэкенд
- Health check: `https://your-app-name.onrender.com/api/health`
- API base: `https://your-app-name.onrender.com/api`

### Фронтенд
- URL: `https://your-username.github.io/MKVR/`

## Локальная разработка

### Бэкенд
```bash
cd backend
npm install
npm run dev
```

### Фронтенд
```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

### Проблемы с CORS
Убедитесь, что в настройках Render добавлен правильный CORS_ORIGIN:
```
CORS_ORIGIN=https://your-username.github.io
```

### Проблемы с базой данных
1. Проверьте подключение к базе данных
2. Убедитесь, что миграции выполнены: `npx prisma migrate deploy`

### Проблемы с GitHub Pages
1. Проверьте, что workflow выполнился успешно
2. Убедитесь, что в настройках репозитория включены GitHub Pages 