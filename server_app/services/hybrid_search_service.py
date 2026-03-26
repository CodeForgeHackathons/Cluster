"""
Гибридный поиск мест: DeepSeek + TF-IDF

Архитектура:
1. DeepSeek генерирует УМНЫЙ поисковый запрос из предпочтений пользователя
2. TF-IDF БЫСТРО ищет top-20 мест по этому запросу
3. DeepSeek ПЕРЕРАНЖИРУЕТ результаты для конкретного туриста
4. Система возвращает top-12 оптимальных мест
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from models import Place
from services.deepseek_service import call_deepseek_chat
from services.place_search_service import search_places_by_embedding, get_places_fallback

logger = logging.getLogger(__name__)


def generate_smart_search_query(
    traveler_type: str,
    start_date: str,
    weather_labels: List[str],
    interests: Optional[str] = None,
) -> str:
    """
    🤖 ШАГИ 1: DeepSeek генерирует УМНЫЙ поисковый запрос
    
    Вместо простого запроса как "семья в июне, дождь",
    DeepSeek создает ДЕТАЛЬНЫЙ запрос с учетом:
    - Типа туриста
    - Сезона
    - Погоды
    - Специальных интересов
    
    Пример:
    Input:  traveler_type="family", start_date="2026-06-15", weather=["Дождь"]
    Output: "Парки с детскими площадками, театры, музеи, 
             крытые развлечения, безопасный темп, кафе"
    """
    
    month = int(start_date.split("-")[1])
    month_names = {
        1: "январь (зима)", 2: "февраль (зима)", 3: "март (весна)",
        4: "апрель (весна)", 5: "май (весна)", 6: "июнь (лето)",
        7: "июль (лето)", 8: "август (лето)", 9: "сентябрь (осень)",
        10: "октябрь (осень)", 11: "ноябрь (осень)", 12: "декабрь (зима)"
    }
    month_name = month_names.get(month, "неизвестно")
    weather_desc = ", ".join(weather_labels) if weather_labels else "переменчивая"
    
    traveler_descriptions = {
        "family": "семья с детьми (нужны безопасные, интересные, не сложные места)",
        "elderly": "пенсионеры (нужны спокойные, доступные, не требующие физических нагрузок)",
        "digital": "фрилансер с ноутбуком (нужны коворкинги, кофе, интернет, вид)",
        "gastro": "гастроэнтузиаст (нужны винодельни, дегустации, местная кухня)",
        "active": "активный отдыхающий (нужны маршруты, прогулки, физическая активность)",
        "eco": "любитель природы (нужна природа, озера, леса, национальные парки)",
    }
    
    traveler_desc = traveler_descriptions.get(
        traveler_type,
        "турист (нужны интересные места)"
    )
    
    prompt = f"""Ты - опытный консультант по туризму в Краснодарском крае.

ЗАДАЧА: Сгенерировать оптимальный поисковый запрос для системы подбора мест.

ПРОФИЛЬ ТУРИСТА:
- Тип: {traveler_desc}
- Дата: {month_name}
- Погода: {weather_desc}
{f'- Специальные интересы: {interests}' if interests else ''}

ТРЕБОВАНИЯ К ЗАПРОСУ:
- Должен быть КОНКРЕТНЫМ и ДЕТАЛЬНЫМ (не просто "семья")
- Включить типы мест, активностей, условия
- Учесть погоду и сезон
- Быть релевантным для системы поиска

ПРИМЕРЫ ХОРОШИХ ЗАПРОСОВ:
- Для семьи в дождь: "Парки с детскими площадками, театры, музеи, крытые развлечения, безопасный темп, кафе"
- Для пенсионеров: "Спокойные парки, не сложные маршруты, доступные места, скамейки, отсутствие толп"
- Для фрилансера: "Коворкинги, кофе, хороший интернет, красивые виды, спокойная атмосфера"
- Для гастронома: "Винодельни, дегустации вина, местные продукты, рестораны с местной кухней"

Напиши ОДИН оптимальный запрос (2-3 предложения, БЕЗ кавычек):
"""
    
    result = call_deepseek_chat(prompt)
    
    if result:
        logger.info(f"DeepSeek сгенерировал запрос: {result}")
        return result
    
    # Fallback если DeepSeek не доступен
    logger.warning("DeepSeek недоступен, используем базовый запрос")
    interests_hint = f". Интересы: {interests}" if interests else ""
    return (
        f"Места для {traveler_desc} в {month_name}, погода: {weather_desc}"
        f"{interests_hint}"
    )


def rerank_places_with_deepseek(
    places: List[Place],
    traveler_type: str,
    start_date: str,
    weather_labels: List[str],
    limit: int = 10,
) -> List[Place]:
    """
    🤖 ШАГ 3: DeepSeek ПЕРЕРАНЖИРУЕТ результаты TF-IDF
    
    TF-IDF вернул top-20 мест, теперь DeepSeek умно их переранжирует
    с учетом всех факторов:
    - Тип туриста
    - Сезон
    - Погода
    - Релевантность
    
    Возвращает top-N мест в ОПТИМАЛЬНОМ порядке
    """
    
    if not places:
        return []
    
    if len(places) <= limit:
        return places
    
    # Форматируем места для DeepSeek
    places_list = "\n".join([
        f"{i+1}. {p.name} ({p.place_type})\n"
        f"   Описание: {p.description_ai or p.description or 'Нет описания'}\n"
        f"   Локация: {p.location or 'Не указана'}"
        for i, p in enumerate(places[:20])
    ])
    
    weather = ", ".join(weather_labels) if weather_labels else "переменчивая"
    
    traveler_map = {
        "family": "семья с детьми",
        "elderly": "пенсионеры",
        "digital": "фрилансер",
        "gastro": "гастроэнтузиаст",
        "active": "активный отдыхающий",
        "eco": "любитель природы",
    }
    traveler_name = traveler_map.get(traveler_type, "турист")
    
    prompt = f"""Ты - эксперт по туризму в Краснодарском крае.

ЗАДАЧА: Переранжировать места для МАКСИМАЛЬНОЙ релевантности туристу.

ПРОФИЛЬ ТУРИСТА:
- Тип: {traveler_name}
- Дата: {start_date}
- Погода: {weather}

МЕСТА (ранжированные TF-IDF):
{places_list}

ТРЕБОВАНИЯ:
1. Выбери топ-{limit} НАИБОЛЕЕ ПОДХОДЯЩИХ мест
2. Учти сезон, погоду, особенности туриста
3. Верни ТОЛЬКО номера в порядке релевантности

ФОРМАТ ОТВЕТА: только номера через запятую (например: 3,1,5,8,2)
Без объяснений, без текста - ТОЛЬКО ЧИСЛА!

Ответ:
"""
    
    response = call_deepseek_chat(prompt)
    
    if not response:
        logger.warning("DeepSeek не ответил, возвращаем исходный порядок")
        return places[:limit]
    
    try:
        # Парсим ответ: "3,1,5,8,2"
        response = response.strip()
        indices = []
        
        for part in response.split(","):
            part = part.strip()
            if part.isdigit():
                idx = int(part) - 1  # Преобразуем из 1-indexed в 0-indexed
                if 0 <= idx < len(places):
                    indices.append(idx)
        
        if indices:
            # Переранжируем в новом порядке
            reranked = [places[i] for i in indices]
            logger.info(f"DeepSeek переранжировал места. Новый порядок: {[i+1 for i in indices]}")
            return reranked
        else:
            logger.warning(f"Не удалось распарсить ответ DeepSeek: {response}")
            return places[:limit]
            
    except Exception as e:
        logger.exception(f"Ошибка при переранжировании: {e}")
        return places[:limit]


def hybrid_search_places(
    db: Session,
    traveler_type: str,
    start_date: str,
    weather_labels: List[str],
    interests: Optional[str] = None,
    limit: int = 12,
) -> List[Place]:
    """
    🔄 ГИБРИДНЫЙ ПОИСК: DeepSeek + TF-IDF
    
    Архитектура:
    1️⃣  DeepSeek генерирует УМНЫЙ запрос (на основе профиля туриста)
    2️⃣  TF-IDF БЫСТРО ищет top-20 мест по этому запросу
    3️⃣  DeepSeek ПЕРЕРАНЖИРУЕТ результаты для конкретного туриста
    4️⃣  Возвращаем top-N оптимальных мест
    
    Args:
        db: Сессия БД
        traveler_type: Тип туриста (family/elderly/digital/gastro/active/eco)
        start_date: Дата начала (YYYY-MM-DD)
        weather_labels: Прогноз погоды на дни путешествия
        interests: Специальные интересы (опционально)
        limit: Сколько мест вернуть (по умолчанию 12)
    
    Returns:
        Список мест в оптимальном порядке
    
    Examples:
        places = hybrid_search_places(
            db=db,
            traveler_type="family",
            start_date="2026-06-15",
            weather_labels=["Дождь", "Облачно", "Ясно"],
            interests="детские парки и театры",
            limit=12
        )
    """
    
    logger.info(
        f"🔄 Начало гибридного поиска: "
        f"traveler={traveler_type}, date={start_date}, weather={weather_labels}"
    )
    
    # 1️⃣  DeepSeek генерирует УМНЫЙ запрос
    logger.info("1️⃣  Генерируем умный поисковый запрос с DeepSeek...")
    smart_query = generate_smart_search_query(
        traveler_type=traveler_type,
        start_date=start_date,
        weather_labels=weather_labels,
        interests=interests,
    )
    logger.info(f"Сгенерирован запрос: '{smart_query}'")
    
    # 2️⃣  TF-IDF быстро ищет top-20
    logger.info("2️⃣  TF-IDF ищет top-20 мест...")
    tfidf_results = search_places_by_embedding(
        db=db,
        query_text=smart_query,
        limit=20,  # Берем больше для переранжирования
    )
    
    if not tfidf_results:
        logger.warning("TF-IDF не нашел мест, используем fallback")
        tfidf_results = get_places_fallback(db, limit=20)
    
    logger.info(f"TF-IDF вернул {len(tfidf_results)} мест")
    
    if not tfidf_results:
        logger.error("Нет мест в БД!")
        return []
    
    # 3️⃣  DeepSeek переранжирует результаты
    logger.info("3️⃣  DeepSeek переранжирует результаты...")
    final_results = rerank_places_with_deepseek(
        places=tfidf_results,
        traveler_type=traveler_type,
        start_date=start_date,
        weather_labels=weather_labels,
        limit=limit,
    )
    
    logger.info(
        f"✅ Гибридный поиск завершен. Возвращено {len(final_results)} мест"
    )
    
    return final_results
