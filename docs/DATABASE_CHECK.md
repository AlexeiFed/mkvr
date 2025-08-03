# Проверка базы данных на Render

## 🔍 Как проверить базу данных

### 1. Через терминал (psql)

```bash
# Подключение к базе
psql "postgresql://mkvr_user:siCW1xH9vwufTdUdvwwgUY8GIqg6BxsP@dpg-d26798muk2gs73bl4k0g-a.singapore-postgres.render.com/mkvr_db"

# Команды для проверки:
\dt                    # Посмотреть все таблицы
\d "School"           # Структура таблицы School (с кавычками!)
\d "Class"            # Структура таблицы Class
\d users              # Структура таблицы users
SELECT * FROM "School";  # Данные школ
SELECT * FROM "Class";   # Данные классов
SELECT * FROM users;     # Данные пользователей
\q                     # Выйти
```

### 2. Через API

```bash
# Проверка подключения к БД
curl https://mkvr-backend.onrender.com/api/schools/test-db

# Проверка школ
curl https://mkvr-backend.onrender.com/api/schools

# Проверка классов
curl https://mkvr-backend.onrender.com/api/schools/classes/all
```

### 3. Через PowerShell скрипт

```powershell
# Запустить проверку структуры БД
powershell -ExecutionPolicy Bypass -File check-db-structure.ps1
```

## 📊 Текущее состояние базы данных

### ✅ Что работает:
- **Подключение к БД**: Стабильное
- **Школы**: 1 запись (Тестовая школа №1)
- **Классы**: 6 записей (1А, 1Б, 2А, 2Б, 3А, 3Б)
- **Смены**: Настроены (1 и 2)

### ⚠️ Проблемы:
- Backend на Render не обновился после добавления новых классов
- API возвращает только старые данные

## 🔧 Решение проблем

### 1. Перезапуск backend на Render:
1. Войти в Render Dashboard
2. Найти сервис `mkvr-backend`
3. Нажать "Manual Deploy" → "Deploy latest commit"
4. Дождаться завершения деплоя

### 2. Проверка после перезапуска:
```bash
# Проверить API классов
curl https://mkvr-backend.onrender.com/api/schools/classes/all

# Должно вернуть все 6 классов с сменами
```

## 📋 Команды для работы с БД

### Создание тестовых данных:
```bash
cd backend
node create-test-data.js
```

### Проверка структуры:
```bash
# В psql:
\d "Class"  # Посмотреть поля таблицы Class
SELECT name, shift FROM "Class";  # Посмотреть классы и смены
```

## 🎯 Результат

После перезапуска backend должны быть доступны:
- ✅ 6 классов с правильными сменами
- ✅ Поле "смена" в форме регистрации работает
- ✅ Выбор школы и классов работает корректно 