# 🧪 Тестирование поиска маршрута с DeepSeek

## 📋 Быстрый старт

### 1. Убедиться, что проект запущен

```bash
docker-compose up -d
```

Проверить статус:
```bash
docker-compose ps
```

Все сервисы должны быть в статусе `healthy` или `running`.

### 2. Получить API ключ DeepSeek

1. Перейти на https://platform.deepseek.com/api_keys
2. Создать новый ключ (или использовать существующий)
3. Скопировать ключ (формат: `sk-...`)

### 3. Установить ключ в docker-compose.yml

Отредактировать файл `/Users/temamodder/Projects/Cluster/docker-compose.yml`:

```yaml
server:
  environment:
    DEEPSEEK_API_KEY: "sk-your-actual-key-here"  # ← Вставить настоящий ключ
```

Перезапустить сервис:
```bash
docker-compose up -d server
```

---

## 🧪 Способ 1: Прямое тестирование (рекомендуется)

### Запустить встроенный тест гибридного поиска

```bash
docker exec cluster_api python scripts/test_hybrid_search.py
```

**Что проверяется:**
- ✓ DeepSeek генерирует умные запросы
- ✓ TF-IDF быстро ищет места
- ✓ DeepSeek переранжирует результаты
- ✓ Гибридный поиск работает для разных типов туристов

**Ожидаемый результат:**
```
================================================================================
🔄 ТЕСТ ГИБРИДНОГО ПОИСКА: DeepSeek + TF-IDF
================================================================================

ПАРАМЕТРЫ ТУРИСТА:
  Тип: family
  Дата: 2026-06-15
  Погода: Дождь, Облачно

ТЕСТ 1: Обычный TF-IDF поиск
┌─────────────────────────────────────────────────────┐
Найдено мест: 5
1. Озеро Абрау
2. Виноградник "Абрау-Дюрсо"
3. Парк имени Толстого
...

ТЕСТ 2: Гибридный поиск (DeepSeek + TF-IDF)
┌─────────────────────────────────────────────────────┐
🤖 Запуск гибридного поиска...
   1️⃣  DeepSeek генерирует умный запрос...
   2️⃣  TF-IDF ищет top-20 мест...
   3️⃣  DeepSeek переранжирует результаты...

✅ Найдено мест: 5
1. Парк имени Толстого
2. Музей мёда
3. Озеро Абрау
...

СРАВНЕНИЕ РЕЗУЛЬТАТОВ
┌─────────────────────────────────────────────────────┐
Top-5 обычного TF-IDF:
  1. Озеро Абрау
  2. Виноградник "Абрау-Дюрсо"
  3. Парк имени Толстого
  ...

Top-5 гибридного поиска:
  1. Парк имени Толстого
  2. Музей мёда
  3. Озеро Абрау
  ...

Изменения в порядке: ДА ✅

✅ ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ
```

---

## 🌐 Способ 2: API тестирование через curl

### Тест 1: Генерация маршрута с гибридным поиском

```bash
curl -X POST http://localhost:8000/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "travelerType": "family",
    "startDate": "2026-06-15",
    "durationDays": 3,
    "weatherByDay": [
      {"day": 1, "labels": ["Дождь", "Облачно"]},
      {"day": 2, "labels": ["Ясно", "Солнечно"]},
      {"day": 3, "labels": ["Облачно"]}
    ]
  }'
```

**Что происходит под капотом:**

1. 🤖 DeepSeek генерирует умный запрос:
   ```
   "Парки с детскими площадками, театры, музеи, 
    крытые развлечения, безопасный темп, кафе"
   ```

2. ⚡ TF-IDF ищет top-20 мест по этому запросу

3. 🤖 DeepSeek переранжирует результаты для семьи в дождь

4. 📅 Результаты распределяются по дням маршрута

### Тест 2: Сравнение разных типов туристов

```bash
# Пенсионеры
curl -X POST http://localhost:8000/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "travelerType": "elderly",
    "startDate": "2026-06-15",
    "durationDays": 2,
    "weatherByDay": [
      {"day": 1, "labels": ["Ясно"]},
      {"day": 2, "labels": ["Облачно"]}
    ]
  }'

# Гастроэнтузиаст
curl -X POST http://localhost:8000/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "travelerType": "gastro",
    "startDate": "2026-06-15",
    "durationDays": 2,
    "weatherByDay": [
      {"day": 1, "labels": ["Ясно"]},
      {"day": 2, "labels": ["Ясно"]}
    ]
  }'

# Фрилансер
curl -X POST http://localhost:8000/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "travelerType": "digital",
    "startDate": "2026-06-15",
    "durationDays": 3,
    "weatherByDay": [
      {"day": 1, "labels": ["Облачно"]},
      {"day": 2, "labels": ["Облачно"]},
      {"day": 3, "labels": ["Ясно"]}
    ]
  }'
```

---

## 🖥️ Способ 3: Web интерфейс

### Тестирование через браузер

1. Открыть http://localhost:5173

2. Нажать кнопку "Сгенерировать маршрут"

3. Выбрать параметры:
   - **Тип туриста:** Family / Elderly / Digital / Gastro / Active / Eco
   - **Дата:** Любая дата
   - **Погода:** Дождь / Облачно / Ясно / Солнечно

4. Нажать "Сгенерировать"

**Что вы увидите:**
- 🗺️ Интерактивная карта с местами на маршруте
- 📅 Распределение мест по дням
- 📍 Детали каждого места (фото, описание, 3D тур)
- 🌦️ Рекомендации, учитывающие погоду

---

## 📊 Что контролирует DeepSeek

### 1️⃣ Генерация умного запроса (`generate_smart_search_query`)

**Вход:** Профиль туриста + сезон + погода
**Выход:** Детальный поисковый запрос

Примеры:
```
ВХОД: family, июнь, дождь
ВЫХОД: "Парки с детскими площадками, театры, музеи, 
         крытые развлечения, безопасный темп, кафе"

ВХОД: elderly, май, солнечно
ВЫХОД: "Спокойные парки, не сложные маршруты, 
        доступные места, скамейки, отсутствие толп"

ВХОД: gastro, август, ясно
ВЫХОД: "Винодельни, дегустации вина, местные продукты, 
        рестораны с местной кухней, виноградники"
```

### 2️⃣ Переранжирование результатов (`rerank_places_with_deepseek`)

**Вход:** Top-20 мест от TF-IDF + профиль туриста
**Выход:** Top-12 оптимальных мест в правильном порядке

**Пример:**
```
БЫЛО (TF-IDF): Озеро, Винодельня, Парк, Музей, Театр, ...
              (просто по релевантности к запросу)

СТАЛО (DeepSeek переранжировал для семьи в дождь):
              Парк, Музей, Театр, Кинотеатр, Винодельня, ...
              (учтена безопасность, интерес детей, крытые помещения)
```

---

## 🔍 Как проверить логи

### Логи DeepSeek запросов

```bash
docker logs cluster_api | grep -i deepseek
```

Ищите строки вроде:
```
[INFO] 🔄 Начало гибридного поиска: traveler=family, date=2026-06-15
[INFO] 1️⃣  Генерируем умный поисковый запрос с DeepSeek...
[INFO] DeepSeek сгенерировал запрос: Парки с детскими площадками...
[INFO] 2️⃣  TF-IDF ищет top-20 мест...
[INFO] 3️⃣  DeepSeek переранжирует результаты...
[INFO] DeepSeek переранжировал места. Новый порядок: [3, 1, 5, 8, 2]
[INFO] ✅ Гибридный поиск завершен. Возвращено 12 мест
```

### Логи ошибок

```bash
docker logs cluster_api | grep -i error
```

Если видите:
```
DEEPSEEK_API_KEY not set
DeepSeek chat request failed
```

→ Проверить, что ключ установлен в docker-compose.yml и контейнер перезагружен.

---

## 🐛 Диагностика проблем

### Проблема: "DEEPSEEK_API_KEY not set"

**Решение:**
```bash
# 1. Отредактировать docker-compose.yml
nano docker-compose.yml

# 2. Найти строку DEEPSEEK_API_KEY и вставить настоящий ключ:
DEEPSEEK_API_KEY: "sk-your-actual-key-here"

# 3. Перезапустить сервис
docker-compose restart server
```

### Проблема: "DeepSeek chat request failed"

**Причины:**
- Неверный ключ (проверить на https://platform.deepseek.com/api_keys)
- Сервис DeepSeek недоступен (check platform.deepseek.com)
- Превышен лимит запросов

**Решение:**
- Система автоматически fallback'ит на TF-IDF
- Маршруты будут генерироваться, но без DeepSeek переранжирования

### Проблема: Маршруты генерируются медленно

**Это нормально!** Гибридный поиск требует 1-3 сек вместо 100ms TF-IDF.

```
Разбивка времени:
- DeepSeek генерирует запрос: ~500ms
- TF-IDF ищет мест: ~50ms
- DeepSeek переранжирует: ~1000ms
- ───────────────────────────
- Итого: ~1.5-2 сек (vs 100ms для TF-IDF)
```

Качество того стоит 🎯

---

## 📈 Метрики для сравнения

Запустить тест с ручным хронометражем:

```bash
# TF-IDF только
time docker exec cluster_api python -c "
from database.session import SessionLocal
from services.place_search_service import search_places_by_embedding
db = SessionLocal()
search_places_by_embedding(db, 'семья с детьми в дождь', 12)
"

# Гибридный поиск
time docker exec cluster_api python -c "
from database.session import SessionLocal
from services.hybrid_search_service import hybrid_search_places
db = SessionLocal()
hybrid_search_places(db, 'family', '2026-06-15', ['Дождь'], 12)
"
```

**Ожидаемые результаты:**
- TF-IDF: ~100ms
- Гибридный: ~1500-2000ms (на 15-20x медленнее, но на 2-3x лучше по качеству)

---

## ✅ Чек-лист полной проверки

- [ ] Docker запущен и все сервисы healthy
- [ ] DeepSeek API ключ добавлен в docker-compose.yml
- [ ] Контейнер сервера перезагружен после добавления ключа
- [ ] Запущен тест: `docker exec cluster_api python scripts/test_hybrid_search.py`
- [ ] Тест прошел успешно и нет ошибок
- [ ] Логи содержат сообщения о DeepSeek генерации и переранжировании
- [ ] API endpoint генерирует маршруты с учетом типа туриста
- [ ] Web интерфейс показывает маршруты с разными местами для разных туристов
- [ ] Результаты отличаются между обычным TF-IDF и гибридным поиском

---

## 📚 Документация

**Архитектура:**
- Прочитать: `/Users/temamodder/Projects/Cluster/HYBRID_SEARCH_IMPLEMENTATION.md`

**Настройка:**
- Прочитать: `/Users/temamodder/Projects/Cluster/HYBRID_SEARCH_SETUP.md`

**Код:**
- `server_app/services/hybrid_search_service.py` - основная логика
- `server_app/services/deepseek_service.py` - работа с API
- `server_app/scripts/test_hybrid_search.py` - тестирование

---

**Готово к тестированию! 🚀**
