from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from database.session import Base
from sqlalchemy import (
    ARRAY,
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, relationship


class Place(Base):
    __tablename__ = "places"

    place_id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    business_id: Mapped[int] = Column(
        Integer, ForeignKey("business_representatives.id"), nullable=False, index=True
    )
    cluster_id: Mapped[Optional[str]] = Column(
        String(64), ForeignKey("clusters.id"), nullable=True, index=True
    )

    # Геокоординаты места (для точной логистики и построения маршрутов).
    # Если координаты не заданы, на фронте/в генераторе используются fallback-координаты кластера.
    lat: Mapped[Optional[float]] = Column(Float, nullable=True, index=True)
    lon: Mapped[Optional[float]] = Column(Float, nullable=True, index=True)

    name: Mapped[str] = Column(String(255), nullable=False)
    # Тип места для фильтрации на фронтенде (например: "винодельня", "отель")
    place_type: Mapped[Optional[str]] = Column(String(100), nullable=True, index=True)
    location: Mapped[Optional[str]] = Column(String(255), nullable=True)
    interesting_fact: Mapped[Optional[str]] = Column(String(255), nullable=True)

    ai_link: Mapped[Optional[str]] = Column(String(2048), nullable=True)

    # 3D тур через AVALIN для "вау"-эффекта
    avalin_tour_url: Mapped[Optional[str]] = Column(String(2048), nullable=True)

    description_ai: Mapped[Optional[str]] = Column(Text, nullable=True)
    # Модератор при необходимости переписывает поверх AI-описания
    description: Mapped[Optional[str]] = Column(Text, nullable=True)

    price: Mapped[Optional[Decimal]] = Column(Numeric(10, 2), nullable=True)

    # Эмбеддинг для семантического поиска (DeepSeek, 1536 dims)
    embedding: Mapped[Optional[list]] = Column(
        ARRAY(Float).with_variant(JSON, "sqlite"),
        nullable=True,
    )

    created_at: Mapped[datetime] = Column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = Column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Eager loaded в эндпоинтах: joinedload(Place.images) + selectinload(Place.reviews)
    cluster: Mapped[Optional["Cluster"]] = relationship(
        "Cluster",
        back_populates="places",
        lazy="selectin",
    )
    business_rep: Mapped["BusinessRepresentative"] = relationship(
        "BusinessRepresentative",
        back_populates="places",
        lazy="selectin",
    )
    images: Mapped[List["PlaceImage"]] = relationship(
        "PlaceImage",
        back_populates="place",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    reviews: Mapped[List["PlaceReview"]] = relationship(
        "PlaceReview",
        back_populates="place",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    special_offers: Mapped[List["SpecialOffer"]] = relationship(
        "SpecialOffer",
        back_populates="place",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def rating(self) -> float:
        """Средний рейтинг по отзывам. (В текущих эндпоинтах считается отдельно.)"""
        if not self.reviews:
            return 0.0
        return float(sum(r.rating for r in self.reviews)) / float(len(self.reviews))


class PlaceImage(Base):
    __tablename__ = "place_images"

    place_image_id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    place_id: Mapped[int] = Column(
        Integer, ForeignKey("places.place_id"), nullable=False, index=True
    )

    image_url: Mapped[str] = Column(String(2048), nullable=False)

    created_at: Mapped[datetime] = Column(
        DateTime, server_default=func.now(), nullable=False
    )

    place: Mapped["Place"] = relationship("Place", back_populates="images")


class PlaceReview(Base):
    __tablename__ = "place_reviews"

    place_review_id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    place_id: Mapped[int] = Column(
        Integer, ForeignKey("places.place_id"), nullable=False, index=True
    )
    tourist_id: Mapped[int] = Column(
        Integer, ForeignKey("tourist_users.id"), nullable=False, index=True
    )

    rating: Mapped[int] = Column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = Column(Text, nullable=True)

    created_at: Mapped[datetime] = Column(
        DateTime, server_default=func.now(), nullable=False
    )

    place: Mapped["Place"] = relationship("Place", back_populates="reviews")
