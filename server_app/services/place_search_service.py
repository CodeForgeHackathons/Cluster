"""Поиск мест по семантической близости (embeddings)."""

from __future__ import annotations

import math
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from models import Place, PlaceImage
from services.deepseek_service import get_embedding


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Косинусное сходство между двумя векторами."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _place_text_for_embedding(place: Place) -> str:
    """Текст для эмбеддинга места (название, тип, локация, факт, описание)."""
    parts = []
    if place.name:
        parts.append(place.name)
    if place.place_type:
        parts.append(place.place_type)
    if place.location:
        parts.append(place.location)
    if place.interesting_fact:
        parts.append(place.interesting_fact)
    desc = place.description or place.description_ai
    if desc:
        parts.append(desc[:500])
    return " ".join(p for p in parts if p)


def _query_text_from_preferences(
    traveler_type: str,
    start_date: str,
    weather_labels: List[str],
) -> str:
    """Строит поисковый запрос из предпочтений пользователя."""
    type_desc = {
        "family": "семья с детьми, детский отдых, семейные развлечения",
        "elderly": "спокойный отдых, пенсионеры, тихие места, без сложных маршрутов",
        "digital": "фриланс, работа с видом, коворкинг, кофе, WiFi",
        "gastro": "гастрономия, вино, дегустации, местная кухня",
        "active": "активный отдых, маршруты, прогулки, тропы",
        "eco": "природа, экология, озёра, лес, тишина",
    }.get(traveler_type, "отдых в Краснодарском крае")

    month_hint = ""
    if start_date and len(start_date) >= 7:
        try:
            m = int(start_date[5:7])
            months = ["зима", "зима", "весна", "весна", "весна", "лето", "лето", "лето", "осень", "осень", "осень", "зима"]
            month_hint = f" {months[m - 1]}"
        except (ValueError, IndexError):
            pass

    weather_hint = ""
    if weather_labels:
        weather_hint = " Погода: " + ", ".join(weather_labels[:3])

    return f"Места для отдыха в Краснодарском крае. {type_desc}.{month_hint}.{weather_hint}"


def search_places_by_embedding(
    db: Session,
    query_text: str,
    limit: int = 15,
    min_similarity: float = 0.0,
) -> List[Place]:
    """
    Ищет места по семантической близости к запросу.
    Возвращает только места с заполненным embedding.
    """
    query_embedding = get_embedding(query_text)
    if not query_embedding:
        return []

    stmt = (
        select(Place)
        .where(Place.embedding.isnot(None))
        .options(joinedload(Place.images), selectinload(Place.reviews))
    )
    places = list(db.execute(stmt).unique().scalars().all())

    scored: List[tuple[Place, float]] = []
    for place in places:
        if not place.embedding:
            continue
        sim = _cosine_similarity(query_embedding, place.embedding)
        if sim >= min_similarity:
            scored.append((place, sim))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in scored[:limit]]


def get_places_fallback(db: Session, limit: int = 12) -> List[Place]:
    """
    Fallback: возвращает последние места из БД без семантического поиска.
    Используется, когда нет DEEPSEEK_API_KEY или embeddings не посчитаны.
    """
    stmt = (
        select(Place)
        .order_by(Place.created_at.desc())
        .options(joinedload(Place.images), selectinload(Place.reviews))
        .limit(limit)
    )
    return list(db.execute(stmt).unique().scalars().all())


def ensure_place_embedding(db: Session, place: Place) -> bool:
    """
    Вычисляет и сохраняет эмбеддинг для места, если его ещё нет.
    Returns True если эмбеддинг успешно сохранён.
    """
    if place.embedding:
        return True

    text = _place_text_for_embedding(place)
    if not text:
        return False

    emb = get_embedding(text)
    if not emb:
        return False

    place.embedding = emb
    db.add(place)
    db.commit()
    db.refresh(place)
    return True
