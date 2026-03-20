from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.session import Base


class BusinessModeratorUser(Base):
    __tablename__ = "moderators"

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
    total_requests = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Заявки на модерацию
    moderation_requests = relationship(
        "BusinessModerationRequest",
        back_populates="moderator",
        lazy="selectin",
    )


class BusinessModerationRequest(Base):
    __tablename__ = "business_moderation_requests"

    id = Column(Integer, primary_key=True, index=True)

    business_rep_id = Column(
        Integer, ForeignKey("business_representatives.id"), nullable=False, index=True
    )
    moderator_id = Column(Integer, ForeignKey("moderators.id"), nullable=True, index=True)

    # Что подал предприниматель. MVP: строка с описанием/контентом заявки.
    request_text = Column(Text, nullable=True)

    # pending | approved | rejected
    status = Column(String(30), default="pending", nullable=False, index=True)
    moderation_comment = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    business_rep = relationship(
        "BusinessRepresentative",
        back_populates="moderation_requests",
        lazy="selectin",
    )
    moderator = relationship(
        "BusinessModeratorUser",
        back_populates="moderation_requests",
        lazy="selectin",
    )

