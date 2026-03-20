from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class TouristUserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None


class TouristUserCreate(TouristUserBase):
    password: str = Field(..., min_length=8)


class TouristUserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None


class TouristUserResponse(TouristUserBase):
    id: int
    is_active: bool
    average_rating: float
    total_trips: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TouristUserDetail(TouristUserResponse):
    pass
