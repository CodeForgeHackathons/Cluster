"""Эндпоинт генерации маршрута по кандидатам, погоде и типу туриста."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_db
from schemas.itinerary_schemas import (
    CandidateInput,
    CoordinatesInput,
    ItineraryDay,
    ItineraryGenerateRequest,
    ItineraryGenerateResponse,
    ItineraryStep,
    PlaceInfoInStep,
    WeatherDayInput,
)
from services.place_search_service import (
    _query_text_from_preferences,
    search_places_by_embedding,
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/itinerary", tags=["itinerary"])

# Координаты по умолчанию для Краснодарского края (если у Place нет lat/lon)
DEFAULT_COORDS = {"lat": 45.0, "lon": 38.0}

SLOTS = ["Утро", "День", "Вечер"]
SEASON_LABELS = {"winter": "зимний", "spring": "весенний", "summer": "летний", "autumn": "осенний"}
TRAVELER_LABELS = {
    "family": "Семья с детьми",
    "elderly": "Пенсионеры",
    "digital": "Фрилансер с ноутбуком",
    "gastro": "Гастроэнтузиаст",
    "active": "Активный отдых",
    "eco": "Эко/природа",
}

SEASON_BEST: dict[str, List[str]] = {
    "cl1": ["summer"],
    "cl2": ["spring", "autumn"],
    "cl3": ["spring", "summer", "autumn", "winter"],
    "cl4": ["autumn", "spring"],
    "cl5": ["spring", "summer"],
    "cl6": ["autumn", "winter"],
}

KEY_HINTS: dict[str, str] = {
    "cl1": "мы поставили акцент на море рядом",
    "cl2": "добавили зелёную паузу у воды",
    "cl3": "оставили фокус на видовых остановках",
    "cl4": "встроили вкусный сценарий с дегустацией",
    "cl5": "включили семейный блок",
    "cl6": "сделали маршрут менее «толповым»",
}


def _place_to_candidate(place) -> CandidateInput:
    """Конвертирует Place (ORM) в CandidateInput."""
    rating = float(place.rating) if hasattr(place, "rating") else 0.0
    price = float(place.price) if place.price is not None else 0.0
    desc = place.description or place.description_ai or ""
    return CandidateInput(
        id=f"p{place.place_id}",
        clusterId=place.place_type or "general",
        title=place.name or "",
        location=place.location or "",
        coordinates=CoordinatesInput(lat=DEFAULT_COORDS["lat"], lon=DEFAULT_COORDS["lon"]),
        rating=rating,
        cost=price,
        fact=place.interesting_fact or "",
        description=desc[:500] if desc else "",
        seasonsBest=[],
        availableMonths=[],
        typeTags=[place.place_type] if place.place_type else [],
        indoorOptions=["помещение"],
        outdoorOptions=["прогулки"],
    )


def _month_to_season(m: int) -> str:
    if m in (12, 1, 2):
        return "winter"
    if 3 <= m <= 5:
        return "spring"
    if 6 <= m <= 8:
        return "summer"
    return "autumn"


def _cluster_key(candidate: CandidateInput) -> str:
    return candidate.id.split("-")[0] if "-" in candidate.id else ""


def _score_candidate(c: CandidateInput, traveler_type: str, month: int) -> float:
    season = _month_to_season(month)
    key = _cluster_key(c)
    title = c.title.lower()
    location = c.location.lower()
    score = 0.0

    best = SEASON_BEST.get(key)
    if best and season in best:
        score += 10

    if traveler_type == "family":
        if "дет" in title:
            score += 12
        if "пар" in title:
            score += 6
        if "интересно" in location:
            score += 4
    elif traveler_type == "elderly":
        if any(w in title for w in ["мягкий", "неспеш", "тих"]):
            score += 12
        if "тих" in location:
            score += 8
    elif traveler_type == "digital":
        if any(w in title for w in ["работ", "коворкин", "вид"]):
            score += 15
        if any(w in location for w in ["кофе", "терраса"]):
            score += 6
    elif traveler_type == "gastro":
        if any(w in title for w in ["вино", "дегуст", "вкус", "ремесла"]):
            score += 15
        if any(w in location for w in ["вкус", "продукт"]):
            score += 8
    elif traveler_type == "active":
        if any(w in title for w in ["маршрут", "прогул", "троп", "паузы"]):
            score += 12
    elif traveler_type == "eco":
        if any(w in title for w in ["природ", "озер", "лес", "тропа"]):
            score += 15
        if "зел" in location:
            score += 6

    if "family" in c.typeTags and traveler_type == "family":
        score += 5
    if "elderly-friendly" in c.typeTags and traveler_type == "elderly":
        score += 5
    if "gastro" in c.typeTags and traveler_type == "gastro":
        score += 5
    if "eco" in c.typeTags and traveler_type == "eco":
        score += 5

    score += round(c.rating * 2)
    return score


def _why_for_place(c: CandidateInput, day_index: int, traveler_type: str, month: int) -> str:
    season = _month_to_season(month)
    key = _cluster_key(c)

    base = {
        "summer": "в тёплый сезон особенно приятно гулять без спешки",
        "winter": "в холодный сезон важны уют и «смысловые» остановки",
        "spring": "весной ощущается свежесть и легко планировать короткие маршруты",
        "autumn": "осенью выигрывают атмосфера и погода для прогулок",
    }.get(season, "под настроение")

    audience = {
        "family": "подходит семье: спокойный темп и понятные сценарии",
        "elderly": "подходит тем, кому важны тишина и удобная логика передвижений",
        "digital": "хорошо для фокуса: вид, кофе и рабочий ритм",
        "gastro": "про вкус: дегустация/ремесло и «история» вокруг места",
        "active": "даёт движение: прогулки и короткие «точки-успеха»",
        "eco": "про природу: вода/лес/тропа и ощущение «я перезагрузился(лась)»",
    }.get(traveler_type, "под настроение")

    hint = KEY_HINTS.get(key, "под настроение")
    return f'Выбранное место: «{c.title}». {hint} — {audience}. {base}. День {day_index + 1}.'


def _logistics_notes(
    c: CandidateInput,
    day_index: int,
    weather: WeatherDayInput | None,
    traveler_type: str,
    month: int,
) -> str:
    parts: List[str] = []
    if weather:
        if weather.isRainy:
            indoor = c.indoorOptions[:2] if c.indoorOptions else ["помещение рядом"]
            parts.append(f"При дожде ({weather.weatherLabel}, {weather.precipitationSum} мм): {', '.join(indoor)}.")
        else:
            outdoor = c.outdoorOptions[:2] if c.outdoorOptions else ["прогулки"]
            parts.append(f"Погода {weather.weatherLabel}: {', '.join(outdoor)}.")
    if c.suitabilityFlags and c.suitabilityFlags.accessibilityNotes:
        parts.append(c.suitabilityFlags.accessibilityNotes)
    return " ".join(parts) if parts else "Обычная логистика."


@router.post("/generate", response_model=ItineraryGenerateResponse)
def generate_itinerary(
    payload: ItineraryGenerateRequest,
    db: Session = Depends(get_db),
) -> ItineraryGenerateResponse:
    """Генерирует маршрут по кандидатам или ищет места в БД по embeddings (DeepSeek)."""
    candidates = list(payload.candidates) if payload.candidates else []

    db_place_by_id: dict[str, object] = {}
    if not candidates:
        query_text = _query_text_from_preferences(
            traveler_type=payload.travelerType or "family",
            start_date=payload.startDate,
            weather_labels=[w.weatherLabel for w in (payload.weatherByDay or []) if w.weatherLabel],
        )
        db_places = search_places_by_embedding(db, query_text=query_text, limit=12)
        candidates = [_place_to_candidate(p) for p in db_places]
        db_place_by_id = {c.id: p for c, p in zip(candidates, db_places)}

    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="Нет кандидатов. Добавьте места с фронта или заполните БД и выставьте DEEPSEEK_API_KEY для семантического поиска.",
        )

    duration = payload.durationDays or 3
    traveler_type = payload.travelerType or "family"

    # Парсим месяц из startDate (YYYY-MM-DD)
    try:
        parts = payload.startDate.split("-")
        month = int(parts[1]) if len(parts) >= 2 else 6
    except (ValueError, IndexError):
        month = 6

    weather_by_day = payload.weatherByDay or []

    sorted_candidates = sorted(
        candidates,
        key=lambda c: _score_candidate(c, traveler_type, month),
        reverse=True,
    )

    day_buckets: List[ItineraryDay] = [
        ItineraryDay(dayIndex=i, steps=[])
        for i in range(duration)
    ]

    for i, cand in enumerate(sorted_candidates):
        day_index = i % duration
        slot_idx = i % 3
        slot = SLOTS[slot_idx]
        weather = weather_by_day[day_index] if day_index < len(weather_by_day) else None

        why = _why_for_place(cand, day_index, traveler_type, month)
        logistics = _logistics_notes(cand, day_index, weather, traveler_type, month)

        place_info = None
        if cand.id in db_place_by_id:
            p = db_place_by_id[cand.id]
            imgs = getattr(p, "images", None) or []
            photo_url = imgs[0].image_url if imgs else ""
            place_info = PlaceInfoInStep(
                id=cand.id,
                title=cand.title,
                location=cand.location,
                cost=cand.cost,
                rating=cand.rating,
                fact=cand.fact,
                description=cand.description[:200] if cand.description else "",
                photoUrl=photo_url,
            )

        day_buckets[day_index].steps.append(
            ItineraryStep(
                slot=slot,
                placeId=cand.id,
                why=why,
                logisticsNotes=logistics,
                placeInfo=place_info,
            )
        )

    season = _month_to_season(month)
    season_adj = SEASON_LABELS.get(season, season)
    traveler_label = TRAVELER_LABELS.get(traveler_type, traveler_type)
    overall_why = (
        f"ИИ-куратор (MVP): для {traveler_label} в {season_adj} период мы распределили места по дням "
        "так, чтобы сохранить темп, логичность и «вау»-атмосферу."
    )

    return ItineraryGenerateResponse(
        itineraryDays=day_buckets,
        overallWhy=overall_why,
    )
