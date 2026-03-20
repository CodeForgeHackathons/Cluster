from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class BusinessRepresentativeBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None


class BusinessRepresentativeCreate(BusinessRepresentativeBase):
    password: str = Field(..., min_length=8)


class BusinessRepresentativeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None


class BusinessRepresentativeResponse(BusinessRepresentativeBase):
    id: int
    is_active: bool
    average_rating: float
    total_places: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BusinessRepresentativeDetail(BusinessRepresentativeResponse):
    pass

