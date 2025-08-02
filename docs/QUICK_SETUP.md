# Быстрая настройка Render Production

## �� Быстрые шаги

### 0. Проверить текущие настройки
В Render Dashboard → `mkvr-backend` → **Environment** проверить:
- ✅ JWT_SECRET=HE1uCtDBn2yzw3vmKH+rIqvlTcLdJLiqzOwEy5dQ2DE= (уже настроен)
- ❌ DATABASE_URL (отсутствует - нужно добавить)

### 1. Создать PostgreSQL базу данных
- В Render Dashboard → **New** → **PostgreSQL**
- Название: `mkvr-database`
- Скопировать **Internal Database URL**

### 2. Добавить DATABASE_URL
В сервисе `mkvr-backend` → **Environment** добавить:
```
DATABASE_URL=postgresql://mkvr_user:siCW1xH9vwufTdUdvwwgUY8GIqg6BxsP@dpg-d26798muk2gs73bl4k0g-a/mkvr_db
```

### 3. Перезапустить сервис
- **Manual Deploy** → **Deploy latest commit**

### 4. Проверить работу
```bash
curl https://mkvr-backend.onrender.com/api/health
curl https://mkvr-backend.onrender.com/api/schools
```

## ✅ Ожидаемый результат
- Health check: 200 OK ✅ (уже работает)
- API schools: 200 OK с данными (после добавления DATABASE_URL)
- Логи показывают: "📋 DATABASE_URL: Настроен"

## ❌ Если не работает
1. Проверить логи в Render Dashboard
2. Убедиться, что DATABASE_URL корректный
3. Проверить, что база данных создана и доступна 