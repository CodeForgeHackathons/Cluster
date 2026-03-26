# DeepSeek Embeddings Проблема и Решение

## 🔴 Проблема

**DeepSeek НЕ поддерживает embeddings API!**

- ❌ Endpoint `/v1/embeddings` не существует
- ❌ Модель `deepseek-embedding` не существует
- ✅ Поддерживает только `/chat/completions`

Исходный код пытался использовать несуществующий embeddings API, что привело бы к 404 ошибкам.

## ✅ Решение

Система переконфигурирована для использования **локального TF-IDF поиска** (бесплатного, встроенного).

### Что было изменено:

#### 1. **core/config.py**
```python
# ❌ ДО (неправильно):
DEEPSEEK_EMBEDDING_MODEL: str = "deepseek-embedding"

# ✅ ПОСЛЕ (правильно):
USE_DEEPSEEK_EMBEDDINGS: bool = False
EMBEDDING_SERVICE: str = "local_tfidf"  # Локальный поиск по умолчанию
```

#### 2. **services/deepseek_service.py**
- `get_embedding()` теперь всегда возвращает `None` (embeddings недоступны)
- Добавлена функция `call_deepseek_chat()` для будущей интеграции с chat API

#### 3. **services/embeddings_service.py** (новый файл)
- Инкапсулирует логику embeddings
- Поддерживает OpenAI API как альтернативу
- Легко добавлять новые провайдеры

#### 4. **services/place_search_service.py**
- Использует локальный TF-IDF поиск по умолчанию
- Embeddings зарезервированы для будущей интеграции

#### 5. **API endpoints**
- `/places/compute-embeddings` → возвращает статус `deprecated`
- `/{place_id}/compute-embedding` → возвращает статус `deprecated`

## 🚀 Как это работает сейчас

### Локальный TF-IDF поиск (встроенный)

```python
def search_places_by_embedding(
    db: Session,
    query_text: str,
    limit: int = 15,
) -> List[Place]:
    # 1. Токенизирует запрос пользователя
    query_tokens = tokenize("семья с детьми")  # ['семья', 'с', 'детьми']
    
    # 2. Для каждого места вычисляет TF-IDF скор
    # 3. Возвращает top-N мест по релевантности
```

**Преимущества:**
- ✅ Работает без интернета
- ✅ Бесплатно (нет API ключей)
- ✅ Быстро
- ✅ На русском языке

**Недостатки:**
- ⚠️ Менее точный, чем embeddings
- ⚠️ Нет семантического понимания

## 💡 Альтернативы: Как добавить embeddings

### Вариант 1: OpenAI API (рекомендуется)

```bash
# .env файл
EMBEDDING_SERVICE=openai
EMBEDDINGS_API_KEY=sk-proj-xxxxx
```

**Код уже подготовлен:**
```python
# services/embeddings_service.py
def get_embedding_from_openai(text: str) -> Optional[List[float]]:
    # Запрашивает text-embedding-3-small
    # Возвращает embeddings размером 1536
```

**Стоимость:** ~0.02$ за 1M tokens

### Вариант 2: Другие провайдеры

Добавить новый провайдер просто:

```python
# services/embeddings_service.py
def get_embedding_from_cohere(text: str) -> Optional[List[float]]:
    # Реализовать запрос к Cohere API
    pass

# core/config.py
if settings.EMBEDDING_SERVICE == "cohere":
    return get_embedding_from_cohere(text)
```

## 🧪 Тестирование

### Запуск тестов поиска:

```bash
# В контейнере
docker exec cluster_api python scripts/test_search.py

# Локально
cd server_app
python scripts/test_search.py
```

### Ожидаемый результат:

```
================================================================================
ТЕСТ ПОИСКА МЕСТ
================================================================================

✅ Всего мест в БД: 18

Тест 1: Поиск по запросу 'семья с детьми'
Найдено мест: 5
1. Парк имени Льва Толстого
   Тип: cl5
   ...

Тест 2: Поиск по запросу 'вино, дегустация'
Найдено мест: 5
...

✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ
```

## 📊 Как генерируются маршруты

**Текущий поток (работает):**

```
1. Пользователь выбирает тип туриста и даты
2. Frontend вызывает POST /itinerary/generate
3. Backend:
   a) Конструирует query_text из предпочтений
   b) Вызывает search_places_by_embedding()
   c) Использует локальный TF-IDF поиск
   d) Получает top-12 мест
   e) Скорит их по сезону, погоде, типу туриста
   f) Распределяет по дням маршрута
   g) Генерирует пояснения и советы
4. Frontend отображает маршрут с картой и 3D турами
```

**Все работает без embeddings API!**

## 🔮 Будущие улучшения

### Short-term (1-2 недели):
- [ ] Интегрировать OpenAI embeddings
- [ ] Добавить кеширование embeddings
- [ ] Оптимизировать TF-IDF скоринг

### Medium-term (1-2 месяца):
- [ ] Интегрировать DeepSeek chat для генерации описаний мест
- [ ] Fine-tune TF-IDF на Краснодарских местах
- [ ] Добавить user feedback loop (улучшение по отзывам)

### Long-term (3+ месяцев):
- [ ] Собственная embedding модель (обучить на местных данных)
- [ ] Retrieval-Augmented Generation (RAG) для описаний
- [ ] Рекомендации на основе коллаборативной фильтрации

## 📝 Резюме

| Аспект | Статус | Детали |
|--------|--------|--------|
| **Embeddings API** | ❌ DeepSeek не поддерживает | Используется локальный TF-IDF |
| **Поиск мест** | ✅ Работает | Бесплатный локальный поиск |
| **Генерация маршрутов** | ✅ Работает | Скоринг + распределение по дням |
| **OpenAI интеграция** | 🔄 Готово, не включено | Требует EMBEDDINGS_API_KEY |
| **3D туры AVALIN** | ✅ Интегрирована | Встроенный viewer |
| **DeepSeek chat** | 🔄 Готовая функция | Для будущей генерации описаний |

## 💬 Контакты

Если у вас вопросы:
- Проверьте логи: `docker logs cluster_api`
- Запустите тесты: `python scripts/test_search.py`
- Читайте комментарии в коде (где есть `ВАЖНО:` или `⚠️`)
