"""Эндпоинт кластеров — группировка мест по типу для лендинга."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from api.deps import get_db
from models import Place

router = APIRouter(prefix="/clusters", tags=["clusters"])

# Названия кластеров по place_type (из seed)
CLUSTER_TITLES: dict[str, str] = {
    "cl1": "Отель и прогулки у моря",
    "cl2": "Дом среди природы",
    "cl3": "Локация для работы с видом",
    "cl4": "Винные маршруты и дегустации",
    "cl5": "Куда сходить с детьми",
    "cl6": "Нестандартная станица и ремесла",
}

# Координаты Краснодарского края по типу кластера
CLUSTER_COORDS: dict[str, dict[str, float]] = {
    "cl1": {"lat": 43.585, "lon": 39.723},   # побережье Сочи
    "cl2": {"lat": 45.041, "lon": 37.360},   # природа/озёра
    "cl3": {"lat": 44.982, "lon": 38.917},   # вид/работа
    "cl4": {"lat": 44.958, "lon": 37.783},   # вино, Анапа
    "cl5": {"lat": 45.025, "lon": 37.170},   # семейный
    "cl6": {"lat": 44.476, "lon": 39.016},   # станица
}


class PlaceInCluster(BaseModel):
    id: str
    photo: str
    rating: float
    title: str
    location: str
    lat: float
    lon: float
    fact: str
    cost: float
    description: str
    reviews_count: int


class ClusterResponse(BaseModel):
    id: str
    coverImage: str
    title: str
    meta: str
    price: float
    rating: float
    reviews_count: int
    places: List[PlaceInCluster]


@router.get("", response_model=List[ClusterResponse])
def list_clusters(db: Session = Depends(get_db)) -> List[ClusterResponse]:
    """Возвращает кластеры (группы мест по place_type) для лендинга."""
    stmt = (
        select(Place)
        .order_by(Place.place_type, Place.place_id)
        .options(joinedload(Place.images), selectinload(Place.reviews))
    )
    places = list(db.execute(stmt).unique().scalars().all())

    by_type: dict[str, list] = {}
    for p in places:
        key = p.place_type or "general"
        if key not in by_type:
            by_type[key] = []
        by_type[key].append(p)

    result: List[ClusterResponse] = []
    for place_type, plist in by_type.items():
        if not plist:
            continue

        title = CLUSTER_TITLES.get(place_type) or (plist[0].name or place_type)
        coords = CLUSTER_COORDS.get(place_type, {"lat": 45.0, "lon": 38.0})
        meta = plist[0].location or "Краснодарский край"

        ratings = []
        total_reviews = 0
        place_items: List[PlaceInCluster] = []

        for p in plist:
            rev_count = len(p.reviews) if p.reviews else 0
            total_reviews += rev_count
            r = float(p.rating) if hasattr(p, "rating") and p.reviews else 4.8
            ratings.append(r)

            imgs = list(p.images) if p.images else []
            photo = imgs[0].image_url if imgs else ""

            place_items.append(
                PlaceInCluster(
                    id=f"{place_type}-p{p.place_id}",
                    photo=photo,
                    rating=r,
                    title=p.name or "",
                    location=p.location or "",
                    lat=coords["lat"],
                    lon=coords["lon"],
                    fact=p.interesting_fact or "",
                    cost=float(p.price or 0),
                    description=(p.description or p.description_ai or "")[:500],
                    reviews_count=rev_count,
                )
            )

        avg_rating = sum(ratings) / len(ratings) if ratings else 4.8
        base_price = place_items[0].cost if place_items else 0
        cover = place_items[0].photo if place_items else ""

        result.append(
            ClusterResponse(
                id=place_type,
                coverImage=cover,
                title=title,
                meta=meta,
                price=round(base_price, 0),
                rating=round(avg_rating, 1),
                reviews_count=total_reviews,
                places=place_items,
            )
        )

    return result
