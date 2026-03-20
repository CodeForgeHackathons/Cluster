from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.session import Base


class BusinessRepresentative(Base):
    __tablename__ = "business_representatives"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=False)

    phone = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String(255), nullable=True)

    is_active = Column(Boolean, default=True)
    average_rating = Column(Float, default=0.0)
    total_places = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Места, которые загрузил/ведёт этот бизнес-представитель
    places = relationship("Place", back_populates="business_rep", lazy="selectin")

    # Заявки этого предпринимателя на модерацию бизнеса
    moderation_requests = relationship(
        "BusinessModerationRequest",
        back_populates="business_rep",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

