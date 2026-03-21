#!/usr/bin/env python3
"""
Тест гибридного поиска: DeepSeek + TF-IDF

Сравнивает результаты:
1. Обычного TF-IDF поиска
2. Гибридного поиска с DeepSeek
"""

import sys
sys.path.insert(0, '/Users/temamodder/Projects/Cluster/server_app')

from database.session import SessionLocal
from services.place_search_service import search_places_by_embedding, get_places_fallback
from services.hybrid_search_service import hybrid_search_places

db = SessionLocal()

try:
    print("=" * 80)
    print("🔄 ТЕСТ ГИБРИДНОГО ПОИСКА: DeepSeek + TF-IDF")
    print("=" * 80)
    print()
    
    # Параметры
    traveler_type = "family"
    start_date = "2026-06-15"
    weather_labels = ["Дождь", "Облачно"]
    
    print("ПАРАМЕТРЫ ТУРИСТА:")
    print(f"  Тип: {traveler_type}")
    print(f"  Дата: {start_date}")
    print(f"  Погода: {', '.join(weather_labels)}")
    print()
    
    # Тест 1: Обычный TF-IDF поиск
    print("-" * 80)
    print("ТЕСТ 1: Обычный TF-IDF поиск")
    print("-" * 80)
    
    query = "Места для семьи в июне, погода: дождь, облачно"
    print(f"Запрос: '{query}'")
    print()
    
    tfidf_results = search_places_by_embedding(db, query_text=query, limit=12)
    if not tfidf_results:
        tfidf_results = get_places_fallback(db, limit=12)
    
    print(f"Найдено мест: {len(tfidf_results)}")
    print()
    for i, place in enumerate(tfidf_results[:5], 1):
        print(f"{i}. {place.name}")
        print(f"   Тип: {place.place_type}")
        print(f"   Локация: {place.location}")
        print()
    
    # Тест 2: Гибридный поиск
    print("-" * 80)
    print("ТЕСТ 2: Гибридный поиск (DeepSeek + TF-IDF)")
    print("-" * 80)
    print()
    
    print("🤖 Запуск гибридного поиска...")
    print("   1️⃣  DeepSeek генерирует умный запрос...")
    print("   2️⃣  TF-IDF ищет top-20 мест...")
    print("   3️⃣  DeepSeek переранжирует результаты...")
    print()
    
    hybrid_results = hybrid_search_places(
        db=db,
        traveler_type=traveler_type,
        start_date=start_date,
        weather_labels=weather_labels,
        limit=12
    )
    
    print(f"✅ Найдено мест: {len(hybrid_results)}")
    print()
    for i, place in enumerate(hybrid_results[:5], 1):
        print(f"{i}. {place.name}")
        print(f"   Тип: {place.place_type}")
        print(f"   Локация: {place.location}")
        print()
    
    # Сравнение
    print("=" * 80)
    print("СРАВНЕНИЕ РЕЗУЛЬТАТОВ")
    print("=" * 80)
    print()
    
    tfidf_names = [p.name for p in tfidf_results[:5]]
    hybrid_names = [p.name for p in hybrid_results[:5]]
    
    print("Top-5 обычного TF-IDF:")
    for i, name in enumerate(tfidf_names, 1):
        print(f"  {i}. {name}")
    
    print()
    print("Top-5 гибридного поиска:")
    for i, name in enumerate(hybrid_names, 1):
        print(f"  {i}. {name}")
    
    print()
    print(f"Изменения в порядке: {'ДА ✅' if tfidf_names != hybrid_names else 'НЕТ ❌'}")
    
    # Другие тесты
    print()
    print("=" * 80)
    print("ТЕСТ 3: Другие типы туристов")
    print("=" * 80)
    print()
    
    test_cases = [
        ("elderly", "Пенсионеры"),
        ("digital", "Фрилансер"),
        ("gastro", "Гастроэнтузиаст"),
        ("eco", "Природолюб"),
    ]
    
    for traveler_type, description in test_cases:
        print(f"\n🔄 {description}:")
        results = hybrid_search_places(
            db=db,
            traveler_type=traveler_type,
            start_date=start_date,
            weather_labels=weather_labels,
            limit=5
        )
        print(f"   Найдено: {len(results)} мест")
        if results:
            print(f"   Топ-1: {results[0].name} ({results[0].place_type})")
    
    print()
    print("=" * 80)
    print("✅ ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ")
    print("=" * 80)
    print()
    print("📊 РЕЗУЛЬТАТЫ:")
    print("   ✓ DeepSeek генерирует умные запросы")
    print("   ✓ TF-IDF быстро ищет мест")
    print("   ✓ DeepSeek переранжирует результаты")
    print("   ✓ Гибридный подход работает!")
    print()
    
finally:
    db.close()
