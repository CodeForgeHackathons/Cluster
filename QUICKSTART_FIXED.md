# ⚡ Быстрый старт (исправленная версия)

## 🎯 Что исправлено

✅ **DeepSeek embeddings проблема решена**
- Система теперь использует встроенный локальный TF-IDF поиск
- Никаких API ключей не требуется для основных функций
- Все работает из коробки

## 🚀 Запуск (3 минуты)

### Windows
```powershell
.\setup_db.ps1
```

### Linux/macOS
```bash
./server_app/scripts/setup_all.sh
```

### Docker (любая ОС)
```bash
cd server_app
docker build -t cluster_api .
docker run -p 8000:8000 cluster_api
```

## ✅ Проверка работы

### 1. Backend API запущен?
```bash
curl http://localhost:8000/docs
```
Должна открыться интерактивная документация API.

### 2. Тестовые данные загружены?
```bash
# В контейнере
docker exec cluster_api python scripts/seed_demo_places.py

# Или локально
cd server_app
python scripts/seed_demo_places.py
```

### 3. Поиск мест работает?
```bash
# Запуск тестов
docker exec cluster_api python scripts/test_search.py

# Вывод должен показать:
# ✅ Всего мест в БД: 18
# ✅ Тест 1: Поиск по запросу 'семья с детьми'
# ✅ Найдено мест: 5
```

### 4. Генерация маршрутов работает?
```bash
curl -X POST http://localhost:8000/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "travelerType": "family",
    "startDate": "2026-06-15",
    "durationDays": 3,
    "weatherByDay": [
      {"isRainy": false, "weatherLabel": "Ясно", "precipitationSum": 0},
      {"isRainy": true, "weatherLabel": "Дождь", "precipitationSum": 10},
      {"isRainy": false, "weatherLabel": "Облачно", "precipitationSum": 0}
    ]
  }'
```

Ответ должен содержать маршрут с 3 днями, каждый день - 3 места (утро/день/вечер).

### 5. Frontend открывается?
```
http://localhost:5173
```

## 📋 Что включено

| Функция | Статус | API ключ нужен |
|---------|--------|---|
| Поиск мест | ✅ Работает | ❌ Нет |
| Генерация маршрутов | ✅ Работает | ❌ Нет |
| 3D туры AVALIN | ✅ Работает | ❌ Нет |
| Прогноз погоды | ✅ Работает | ❌ Нет |
| B2B кабинет партнёра | ✅ Работает | ❌ Нет |
| **Embeddings API** | ⚠️ LocalTF-IDF | ❌ Нет (бесплатный fallback) |

## 🔧 Конфигурация (опционально)

### Если хотите использовать OpenAI embeddings:

```bash
# server_app/.env
EMBEDDING_SERVICE=openai
EMBEDDINGS_API_KEY=sk-proj-xxxxxxxxxxxxx
```

Но это **НЕ требуется** для базовой функциональности!

### Если хотите добавить DeepSeek chat:

```bash
# server_app/.env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
```

Используется для будущих фич (генерация описаний и т.д.).

## 📱 Тестирование в браузере

### 1. Откройте http://localhost:5173
### 2. Выберите:
   - Тип туриста: "Семья с детьми"
   - Дату: сегодня
   - Длительность: 3 дня
### 3. Нажмите "Сгенерировать маршрут"
### 4. Должны увидеть:
   - Карусель первого места (фото + факт)
   - 3 дня с утром/днем/вечером
   - Интерактивную карту
   - Прогноз погоды
   - Кнопку "3D тур"

## 🐛 Если что-то не работает

### Проверьте логи:
```bash
# Docker
docker logs cluster_api

# Локально (в папке server_app)
tail -f logs/app.log
```

### Типичные проблемы:

**Ошибка: "Connection refused localhost:5432"**
- PostgreSQL не запущена
- Выполните: `./setup_db.ps1` (Windows) или `./server_app/scripts/setup_all.sh` (Linux/Mac)

**Ошибка: "No places in database"**
- Тестовые данные не загружены
- Выполните: `docker exec cluster_api python scripts/seed_demo_places.py`

**Frontend не загружается (http://localhost:5173)**
- Vite dev server не запущен
- Выполните: `cd client_app && npm run dev`

**Ошибка DeepSeek в логах**
- Это нормально! Система работает без embeddings API
- Используется встроенный TF-IDF поиск

## 📚 Дополнительные материалы

- **[DEEPSEEK_EMBEDDINGS_FIX.md](./DEEPSEEK_EMBEDDINGS_FIX.md)** — подробное объяснение проблемы и решения
- **API документация** — http://localhost:8000/docs
- **Исходный код** — `server_app/` и `client_app/`

## 🎉 Готово!

Система работает полностью и готова к демонстрации жюри:

1. ✅ Персональные маршруты
2. ✅ 3D туры
3. ✅ B2B кабинет
4. ✅ Семантический поиск (локальный)
5. ✅ Вау-эффект (интерактивные карты)

Никаких дополнительных конфигураций не требуется!
