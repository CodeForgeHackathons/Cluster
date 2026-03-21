#!/bin/bash

# Полная настройка проекта для хакатона
# Запускать из корневой директории проекта

echo "🚀 Настройка проекта Cluster для хакатона..."

# 1. Создание и запуск Docker контейнеров
echo "📦 Создание и запуск Docker контейнеров..."
docker-compose down
docker-compose up --build -d

# Ожидание запуска PostgreSQL
echo "⏳ Ожидание запуска PostgreSQL..."
sleep 10

# 2. Применение миграций
echo "🗄️ Применение миграций базы данных..."
docker-compose exec server python -m alembic upgrade head

# 3. Создание демо-данных
echo "🏗️ Создание демо-данных мест..."
docker-compose exec server python scripts/seed_demo_places.py

# 4. Создание спецпредложений бизнеса
echo "💰 Создание спецпредложений от бизнеса..."
docker-compose exec server python scripts/init_special_offers.py

# 5. Вычисление эмбеддингов для мест
echo "🤖 Вычисление AI эмбеддингов..."
docker-compose exec server python -c "
import httpx

def compute_embeddings():
    with httpx.Client() as client:
        resp = client.post('http://localhost:8000/places/compute-embeddings')
        if resp.status_code == 200:
            print('✅ Эмбеддинги успешно вычислены')
        else:
            print(f'❌ Ошибка вычисления эмбеддингов: {resp.status_code}')

compute_embeddings()
"

echo ""
echo "🎉 Проект успешно настроен!"
echo ""
echo "🌐 Доступные сервисы:"
echo "   • Frontend: http://localhost:5173"
echo "   • Backend API: http://localhost:8000"
echo "   • API Документация: http://localhost:8000/docs"
echo "   • PostgreSQL: localhost:5432"
echo ""
echo "🔑 Демо-данные:"
echo "   • 18 мест с 3D турами AVALIN"
echo "   • Спецпредложения от бизнеса"
echo "   • AI эмбеддинги для семантического поиска"
echo ""
echo "🎯 Ключевые фичи для хакатона:"
echo "   ✅ Вау-эффект: 3D туры по местам"
echo "   ✅ B2B ценность: спецпредложения"
echo "   ✅ AI персонализация: эмбеддинги"
echo "   ✅ Сезонность: умные маршруты"
echo ""
echo "🚀 Готово к демонстрации жюри!"
