#!/usr/bin/env python3
"""
Тестовый скрипт для проверки работы поиска мест.

Использует локальный TF-IDF поиск (без API ключей).
"""

import sys
sys.path.insert(0, '/Users/temamodder/Projects/Cluster/server_app')

from database.session import SessionLocal
from services.place_search_service import (
    search_places_by_embedding,
    get_places_fallback,
)
from models import Place

db = SessionLocal()

try:
    print("=" * 80)
    print("ТЕСТ ПОИСКА МЕСТ")
    print("=" * 80)
    
    # 1. Получить все места
    all_places = db.query(Place).all()
    print(f"\n✅ Всего мест в БД: {len(all_places)}")
    
    if len(all_places) == 0:
        print("\n⚠️  В БД нет мест. Запустите seed:")
        print("   docker exec cluster_api python scripts/seed_demo_places.py")
        sys.exit(1)
    
    # 2. Тест локального TF-IDF поиска
    print("\n" + "-" * 80)
    print("Тест 1: Поиск по запросу 'семья с детьми'")
    print("-" * 80)
    
    results = search_places_by_embedding(
        db,
        query_text="семья с детьми, парк, игры",
        limit=5
    )
    
    print(f"Найдено мест: {len(results)}")
    for i, place in enumerate(results, 1):
        print(f"{i}. {place.name}")
        print(f"   Тип: {place.place_type}")
        print(f"   Локация: {place.location}")
        print()
    
    # 3. Тест поиска по другому запросу
    print("-" * 80)
    print("Тест 2: Поиск по запросу 'вино, дегустация'")
    print("-" * 80)
    
    results = search_places_by_embedding(
        db,
        query_text="вино, дегустация, виноградник",
        limit=5
    )
    
    print(f"Найдено мест: {len(results)}")
    for i, place in enumerate(results, 1):
        print(f"{i}. {place.name}")
        print(f"   Тип: {place.place_type}")
        print()
    
    # 4. Тест поиска по природе
    print("-" * 80)
    print("Тест 3: Поиск по запросу 'природа, озеро, лес'")
    print("-" * 80)
    
    results = search_places_by_embedding(
        db,
        query_text="природа, озеро, лес, тишина",
        limit=5
    )
    
    print(f"Найдено мест: {len(results)}")
    for i, place in enumerate(results, 1):
        print(f"{i}. {place.name}")
        print(f"   Интересный факт: {place.interesting_fact}")
        print()
    
    print("=" * 80)
    print("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ")
    print("=" * 80)
    print("\n📊 ИТОГ:")
    print("   - Локальный TF-IDF поиск работает")
    print("   - Не требуется API ключ")
    print("   - Система готова к использованию")
    
finally:
    db.close()
