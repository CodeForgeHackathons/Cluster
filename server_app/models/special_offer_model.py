"""Модель спецпредложения от бизнеса на выбранные даты."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func, Column
from sqlalchemy.orm import Mapped, relationship

from database.session import Base


class SpecialOffer(Base):
    __tablename__ = "special_offers"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    place_id: Mapped[int] = Column(Integer, ForeignKey("places.place_id"), nullable=False, index=True)
    business_id: Mapped[int] = Column(
        Integer, ForeignKey("business_representatives.id"), nullable=False, index=True
    )

    title: Mapped[str] = Column(String(255), nullable=False)
    description: Mapped[Optional[str]] = Column(Text, nullable=True)

    discount_percent: Mapped[Optional[float]] = Column(Numeric(5, 2), nullable=True)
    special_price: Mapped[Optional[Decimal]] = Column(Numeric(10, 2), nullable=True)

    start_date: Mapped[date] = Column(Date, nullable=False)
    end_date: Mapped[date] = Column(Date, nullable=False)

    created_at: Mapped[datetime] = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = Column(DateTime, server_default=func.now(), onupdate=func.now())

    place = relationship("Place", back_populates="special_offers")
