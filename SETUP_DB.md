# Настройка базы данных Cluster

## Требования

- **Docker Desktop** (Windows/Mac) или Docker + Docker Compose (Linux)
- Порт **5432** свободен (PostgreSQL)

---

## Быстрый старт (Windows)

```powershell
.\setup_db.ps1
```

Скрипт сам:
1. Запустит контейнеры (`cluster_db`, `cluster_api`, `cluster_client`)
2. Подождёт готовности PostgreSQL
3. Зальёт 18 демо-мест в БД

---

## Ручная настройка

### 1. Запуск контейнеров

```bash
docker-compose up -d
```

### 2. Проверка, что БД работает

```bash
docker exec cluster_db pg_isready -U cluster_user -d clusterdb
```

Должно вывести: `clusterdb:5432 - accepting connections`

### 3. Таблицы

Таблицы создаются автоматически при старте API (`Base.metadata.create_all` в `main.py`).

### 4. Демо-данные (seed)

```bash
docker exec cluster_api bash -c "cd /app && PYTHONPATH=/app python scripts/seed_demo_places.py"
```

Должно вывести: `Seed completed.`

### 5. Проверка

```bash
curl http://localhost:8000/places
```

Должен вернуть JSON-массив из 18 мест.

---

## Если БД уже есть и нужен повторный seed

Скрипт seed пропускает кластеры, если места с таким `place_type` уже есть. Чтобы залить заново:

```bash
# Очистить таблицы (осторожно!)
docker exec -it cluster_db psql -U cluster_user -d clusterdb -c "
  TRUNCATE place_images, places, business_representatives CASCADE;
"

# Запустить seed
docker exec cluster_api bash -c "cd /app && PYTHONPATH=/app python scripts/seed_demo_places.py"
```

Или полностью пересоздать volumes:

```bash
docker-compose down -v
docker-compose up -d
# Подождать ~15 сек, затем seed как выше
```

---

## Подключение к БД с хоста

| Параметр | Значение |
|----------|----------|
| Host     | localhost |
| Port     | 5432 |
| Database | clusterdb |
| User     | cluster_user |
| Password | password |

Строка подключения: `postgresql://cluster_user:password@localhost:5432/clusterdb`

---

## Эмбеддинги (для ИИ-поиска)

После seed можно вычислить эмбеддинги (если есть `DEEPSEEK_API_KEY`):

1. Добавить в `server_app/.env`:
   ```
   DEEPSEEK_API_KEY=sk-...
   ```

2. Перезапустить API и выполнить:
   ```
   POST http://localhost:8000/places/compute-embeddings
   ```
