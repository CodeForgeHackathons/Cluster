from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import AnyUrl, BaseModel, Field, field_validator


class PlaceBase(BaseModel):
    business_id: int  # заполняется на бэкенде из токена, в PlaceCreate не требуется
    name: str = Field(..., min_length=1, max_length=255)
    # Тип места для фильтрации на фронтенде
    place_type: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    interesting_fact: Optional[str] = Field(None, max_length=255)
    ai_link: Optional[AnyUrl] = None
    avalin_tour_url: Optional[AnyUrl] = None

    description_ai: Optional[str] = None
    description: Optional[str] = None

    price: Optional[Decimal] = None

    @field_validator("interesting_fact", mode="before")
    @classmethod
    def validate_interesting_fact(cls, v):
        return _validate_two_words(v)


class PlaceCreate(PlaceBase):
    business_id: int = 0  # переопределяем как необязательное — реальное значение подставляет эндпоинт из токена
    images: List[str] = Field(default_factory=list)


class PlaceUpdate(BaseModel):
    business_id: Optional[int] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)

    place_type: Optional[str] = Field(default=None, max_length=100)

    location: Optional[str] = Field(default=None, max_length=255)
    interesting_fact: Optional[str] = Field(default=None, max_length=255)
    ai_link: Optional[AnyUrl] = None
    avalin_tour_url: Optional[AnyUrl] = None

    description_ai: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None

    images: Optional[List[str]] = None

    @field_validator("interesting_fact", mode="before")
    @classmethod
    def validate_interesting_fact(cls, v):
        return _validate_two_words(v)


class PlaceResponse(PlaceBase):
    place_id: int
    created_at: datetime

    images: List[str] = Field(default_factory=list)
    rating: float = 0.0

    class Config:
        from_attributes = True


class PlaceReviewResponse(BaseModel):
    tourist_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PlaceDetailResponse(PlaceResponse):
    # В детальной карточке показываем отзывы
    reviews: List[PlaceReviewResponse] = Field(default_factory=list)


def _validate_two_words(value: Optional[str]) -> Optional[str]:
    if value is None or not str(value).strip():
        return value
    words = [w for w in str(value).strip().split(" ") if w]
    if len(words) < 1 or len(words) > 10:
        raise ValueError("Интересный факт: от 1 до 10 слов")
    return value
