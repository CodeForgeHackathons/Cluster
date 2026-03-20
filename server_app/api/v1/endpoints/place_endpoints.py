@ -0,0 +1,168 @@
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from api.deps import get_db
from models import Place, PlaceImage
from schemas import PlaceCreate, PlaceDetailResponse, PlaceResponse, PlaceReviewResponse, PlaceUpdate


router = APIRouter(prefix="/places", tags=["places"])


def _final_description(place: Place) -> Optional[str]:
    # Если модератор не переписал - показываем AI-версию
    if place.description is not None and place.description != "":
        return place.description
    return place.description_ai


def _calc_rating(place: Place) -> float:
    if not place.reviews:
        return 0.0
    return float(sum(r.rating for r in place.reviews)) / float(len(place.reviews))


def _place_to_detail(place: Place) -> PlaceDetailResponse:
    rating = _calc_rating(place)
    reviews = [
        PlaceReviewResponse(
            tourist_id=r.tourist_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
        )
        for r in (place.reviews or [])
    ]
    return PlaceDetailResponse(
        place_id=place.place_id,
        business_id=place.business_id,
        name=place.name,
        location=place.location,
        interesting_fact=place.interesting_fact,
        ai_link=place.ai_link,
        description_ai=place.description_ai,
        description=_final_description(place),
        price=place.price,
        created_at=place.created_at,
        images=[img.image_url for img in (place.images or [])],
        rating=rating,
        reviews=reviews,
    )


@router.post("", response_model=PlaceDetailResponse)
def create_place(payload: PlaceCreate, db: Session = Depends(get_db)) -> PlaceDetailResponse:
    place = Place(
        business_id=payload.business_id,
        name=payload.name,
        location=payload.location,
        interesting_fact=payload.interesting_fact,
        ai_link=str(payload.ai_link) if payload.ai_link is not None else None,
        description_ai=payload.description_ai,
        description=payload.description,
        price=payload.price,
    )
    db.add(place)
    db.commit()
    db.refresh(place)

    if payload.images:
        db.add_all(
            [PlaceImage(place_id=place.place_id, image_url=url) for url in payload.images]
        )
        db.commit()
        db.refresh(place)

    # place.images догрузится через relationship(lazy="joined") либо после refresh
    return _place_to_detail(place)


@router.put("/{place_id}", response_model=PlaceDetailResponse)
def update_place(
    place_id: int,
    payload: PlaceUpdate,
    db: Session = Depends(get_db),
) -> PlaceDetailResponse:
    stmt = (
        select(Place)
        .where(Place.place_id == place_id)
        .options(joinedload(Place.images), selectinload(Place.reviews))
    )
    place = db.execute(stmt).scalars().first()
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")

    if payload.business_id is not None:
        place.business_id = payload.business_id
    if payload.name is not None:
        place.name = payload.name
    if payload.location is not None:
        place.location = payload.location
    if payload.interesting_fact is not None:
        place.interesting_fact = payload.interesting_fact
    if payload.ai_link is not None:
        place.ai_link = str(payload.ai_link)
    if payload.description_ai is not None:
        place.description_ai = payload.description_ai
    if payload.description is not None:
        place.description = payload.description
    if payload.price is not None:
        place.price = payload.price

    # images: если images is not None -> заменяем полностью
    if payload.images is not None:
        place.images = []
        if payload.images:
            place.images = [PlaceImage(place_id=place_id, image_url=url) for url in payload.images]

    db.add(place)
    db.commit()
    db.refresh(place)
    return _place_to_detail(place)


@router.get("", response_model=List[PlaceResponse])
def list_places(db: Session = Depends(get_db)) -> List[PlaceResponse]:
    stmt = (
        select(Place)
        .order_by(Place.created_at.desc())
        .options(joinedload(Place.images), selectinload(Place.reviews))
    )
    places = db.execute(stmt).scalars().all()

    return [
        PlaceResponse(
            place_id=p.place_id,
            business_id=p.business_id,
            name=p.name,
            location=p.location,
            interesting_fact=p.interesting_fact,
            ai_link=p.ai_link,
            description_ai=p.description_ai,
            description=_final_description(p),
            price=p.price,
            created_at=p.created_at,
            images=[img.image_url for img in (p.images or [])],
            rating=_calc_rating(p),
        )
        for p in places
    ]


@router.get("/{place_id}", response_model=PlaceDetailResponse)
def get_place(place_id: int, db: Session = Depends(get_db)) -> PlaceDetailResponse:
    stmt = (
        select(Place)
        .where(Place.place_id == place_id)
        .options(joinedload(Place.images), selectinload(Place.reviews))
    )
    place = db.execute(stmt).scalars().first()
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return _place_to_detail(place)
