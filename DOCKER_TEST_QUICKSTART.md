# 🐳 Тестирование через Docker - Быстрый старт

## 🚀 1. Запустить контейнеры

```bash
cd /Users/temamodder/Projects/Cluster
docker-compose up -d
```

Проверить статус:
```bash
docker-compose ps
```

Должны быть запущены 4 контейнера:
- `cluster_db` - PostgreSQL (должен быть healthy)
- `cluster_api` - FastAPI (зависит от db)
- `cluster_client` - Vue 3 frontend
- `cluster_seed` - если запустили с profile seed

---

## 🧪 2. Установить DeepSeek ключ

### Способ 1: Отредактировать docker-compose.yml (рекомендуется)

```bash
# Открыть в редакторе
nano docker-compose.yml

# Найти строку 42:
DEEPSEEK_API_KEY: "[REDACTED:api-key]"

# Заменить на:
DEEPSEEK_API_KEY: "sk-your-actual-key-here"
```

Перезапустить:
```bash
docker-compose restart server
docker-compose logs -f server  # Проверить логи
```

### Способ 2: Через переменную окружения (временно)

```bash
docker-compose down
DEEPSEEK_API_KEY="sk-your-actual-key-here" docker-compose up -d
```

---

## 🧪 3. Основные тесты

### Тест 1: Запустить встроенный тест гибридного поиска

```bash
docker exec cluster_api python scripts/test_hybrid_search.py
```

**Вывод должен быть:**
```
================================================================================
🔄 ТЕСТ ГИБРИДНОГО ПОИСКА: DeepSeek + TF-IDF
================================================================================

ПАРАМЕТРЫ ТУРИСТА:
  Тип: family
  Дата: 2026-06-15
  Погода: Дождь, Облачно

...

✅ ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ
```

---

### Тест 2: Проверить логи DeepSeek

```bash
docker logs cluster_api | grep -i deepseek
```

**Должны быть сообщения типа:**
```
[INFO] 🔄 Начало гибридного поиска
[INFO] 1️⃣  Генерируем умный поисковый запрос с DeepSeek...
[INFO] DeepSeek сгенерировал запрос: Парки с детскими...
[INFO] 2️⃣  TF-IDF ищет top-20 мест...
[INFO] 3️⃣  DeepSeek переранжирует результаты...
[INFO] ✅ Гибридный поиск завершен
```

---

### Тест 3: API тестирование через curl

```bash
# Простой тест генерации маршрута
docker exec cluster_api curl -s http://localhost:8000/places | python -m json.tool | head -20
```

**Должны вернуться места в JSON:**
```json
[
  {
    "id": 1,
    "name": "Озеро Абрау",
    "description": "...",
    "place_type": "nature",
    ...
  },
  ...
]
```

---

### Тест 4: Полный тест маршрута (внутри контейнера)

```bash
docker exec cluster_api python3 << 'EOF'
import requests
import json

# Генерируем маршрут для семьи
payload = {
    "travelerType": "family",
    "startDate": "2026-06-15",
    "durationDays": 3,
    "weatherByDay": [
        {"day": 1, "labels": ["Дождь", "Облачно"]},
        {"day": 2, "labels": ["Ясно"]},
        {"day": 3, "labels": ["Облачно"]}
    ]
}

response = requests.post(
    "http://localhost:8000/itinerary/generate",
    json=payload
)

if response.status_code == 200:
    data = response.json()
    print("✅ Маршрут успешно сгенерирован!")
    print(f"Дней: {len(data.get('days', []))}")
    print(f"Всего мест: {sum(len(day.get('places', [])) for day in data.get('days', []))}")
    
    # Вывести места за день 1
    if data.get('days'):
        print(f"\nМеста на день 1:")
        for i, place in enumerate(data['days'][0].get('places', []), 1):
            print(f"  {i}. {place.get('name')}")
else:
    print(f"❌ Ошибка: {response.status_code}")
    print(response.text)
EOF
```

---

## 🔧 4. Диагностика

### Проверить все сервисы

```bash
# Статус всех контейнеров
docker-compose ps

# Логи сервера (последние 50 строк)
docker logs -n 50 cluster_api

# Логи БД
docker logs -n 50 cluster_db

# Логи фронтенда
docker logs -n 50 cluster_client
```

### Проверить подключение к БД из контейнера

```bash
docker exec cluster_api python3 << 'EOF'
from database.session import SessionLocal
from models import Place

db = SessionLocal()
count = db.query(Place).count()
print(f"✅ Подключение к БД работает. Мест в БД: {count}")
db.close()
EOF
```

### Проверить DeepSeek ключ

```bash
docker exec cluster_api python3 << 'EOF'
from core.config import settings
if settings.DEEPSEEK_API_KEY:
    print(f"✅ DeepSeek API ключ установлен: {settings.DEEPSEEK_API_KEY[:10]}...")
else:
    print("❌ DeepSeek API ключ НЕ установлен")
EOF
```

---

## 📊 5. Интерактивное тестирование

### Запустить Python сессию внутри контейнера

```bash
docker exec -it cluster_api python3

# Теперь вы можете выполнять команды:
```

**Пример сессии:**

```python
from database.session import SessionLocal
from services.hybrid_search_service import hybrid_search_places

db = SessionLocal()

# Тест 1: Поиск для семьи в дождь
places = hybrid_search_places(
    db=db,
    traveler_type="family",
    start_date="2026-06-15",
    weather_labels=["Дождь", "Облачно"],
    limit=5
)

print("Места для семьи в дождь:")
for p in places:
    print(f"  - {p.name} ({p.place_type})")

# Тест 2: Поиск для пенсионеров
places = hybrid_search_places(
    db=db,
    traveler_type="elderly",
    start_date="2026-06-15",
    weather_labels=["Ясно"],
    limit=5
)

print("\nМеста для пенсионеров:")
for p in places:
    print(f"  - {p.name} ({p.place_type})")

# Выход
exit()
```

---

## 🌐 6. Браузер тестирование

### Открыть интерфейс

```bash
# Узнать IP контейнера
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' cluster_client

# Открыть в браузере
# http://localhost:5173
```

### Создать маршрут вручную

1. Откроешь http://localhost:5173
2. Нажмешь "Сгенерировать маршрут"
3. Выберешь параметры:
   - Family / Elderly / Digital / Gastro / Active / Eco
   - Дата путешествия
   - Погода по дням
4. Нажмешь "Сгенерировать"
5. Смотришь результаты на карте

---

## 📈 7. Сравнительный тест

### Выполнить рядом обычный и гибридный поиск

```bash
docker exec cluster_api python3 << 'EOF'
from database.session import SessionLocal
from services.place_search_service import search_places_by_embedding
from services.hybrid_search_service import hybrid_search_places

db = SessionLocal()

print("=" * 80)
print("СРАВНЕНИЕ: TF-IDF vs Гибридный поиск")
print("=" * 80)
print()

# TF-IDF
print("1️⃣  TF-IDF поиск:")
tfidf_results = search_places_by_embedding(
    db=db,
    query_text="семья с детьми, дождь",
    limit=5
)
for i, p in enumerate(tfidf_results, 1):
    print(f"   {i}. {p.name} ({p.place_type})")

print()

# Гибридный
print("2️⃣  Гибридный поиск (DeepSeek + TF-IDF):")
hybrid_results = hybrid_search_places(
    db=db,
    traveler_type="family",
    start_date="2026-06-15",
    weather_labels=["Дождь"],
    limit=5
)
for i, p in enumerate(hybrid_results, 1):
    print(f"   {i}. {p.name} ({p.place_type})")

print()
print("Порядок изменился?", 
      "ДА ✅" if [p.id for p in tfidf_results] != [p.id for p in hybrid_results] else "НЕТ")

db.close()
EOF
```

---

## 🐛 8. Если что-то не работает

### Ошибка: "Connection refused"

```bash
# Проверить, запущена ли БД
docker ps | grep cluster_db

# Перезапустить все
docker-compose restart
docker-compose logs -f server  # Следить за логами
```

### Ошибка: "DEEPSEEK_API_KEY not set"

```bash
# 1. Проверить текущий ключ
docker exec cluster_api python3 -c "from core.config import settings; print(settings.DEEPSEEK_API_KEY)"

# 2. Если пусто - остановить, отредактировать, перезапустить
docker-compose down
nano docker-compose.yml  # Отредактировать строку 42
docker-compose up -d server
```

### Ошибка: "DeepSeek chat request failed"

```bash
# Проверить интернет внутри контейнера
docker exec cluster_api curl -I https://api.deepseek.com

# Проверить логи
docker logs cluster_api | grep -i deepseek | tail -20
```

Если ошибка - система fallback'ит на TF-IDF, и приложение все равно работает!

---

## 📋 Полный чек-лист тестирования

```bash
# 1. Запустить контейнеры
docker-compose up -d

# 2. Проверить статус
docker-compose ps

# 3. Установить ключ DeepSeek
nano docker-compose.yml  # Отредактировать DEEPSEEK_API_KEY
docker-compose restart server

# 4. Запустить основной тест
docker exec cluster_api python scripts/test_hybrid_search.py

# 5. Проверить логи
docker logs cluster_api | grep -i deepseek

# 6. Тест API
docker exec cluster_api python3 << 'EOF'
import requests
response = requests.post(
    "http://localhost:8000/itinerary/generate",
    json={
        "travelerType": "family",
        "startDate": "2026-06-15",
        "durationDays": 2,
        "weatherByDay": [{"day": 1, "labels": ["Дождь"]}, {"day": 2, "labels": ["Ясно"]}]
    }
)
print("✅ OK" if response.status_code == 200 else f"❌ Error {response.status_code}")
EOF

# 7. Открыть в браузере
# http://localhost:5173
```

---

## 🎯 Самый быстрый способ

```bash
# Все в одной команде
cd /Users/temamodder/Projects/Cluster && \
docker-compose down && \
docker-compose up -d && \
sleep 10 && \
docker exec cluster_api python scripts/test_hybrid_search.py && \
docker logs cluster_api | grep -i deepseek | tail -20
```

---

**Готово к тестированию! 🚀**
