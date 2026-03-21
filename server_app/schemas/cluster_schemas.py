from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ClusterBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    meta: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None


class ClusterCreate(ClusterBase):
    pass


class ClusterUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    meta: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None


class ClusterResponse(ClusterBase):
    id: str
    business_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
