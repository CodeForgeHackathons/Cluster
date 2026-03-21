"""Схемы для спецпредложений от бизнеса."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class SpecialOfferBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    discount_percent: Optional[float] = Field(None, ge=0, le=100)
    special_price: Optional[Decimal] = Field(None, ge=0)
    start_date: date
    end_date: date


class SpecialOfferCreate(SpecialOfferBase):
    place_id: int
    business_id: int


class SpecialOfferUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    discount_percent: Optional[float] = Field(None, ge=0, le=100)
    special_price: Optional[Decimal] = Field(None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SpecialOfferResponse(SpecialOfferBase):
    id: int
    place_id: int
    business_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SpecialOfferWithPlace(SpecialOfferResponse):
    place_name: str = ""
    place_location: Optional[str] = None
    place_price: Optional[Decimal] = None
