from __future__ import annotations

from datetime import datetime

from database.session import Base
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship


class Cluster(Base):
    __tablename__ = "clusters"

    # Автогенерируемый ID (slug/uid), например "cl_xxx"
    id = Column(String(64), primary_key=True, index=True)

    business_id = Column(
        ForeignKey("business_representatives.id"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)
    meta = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    # pending | approved | rejected
    status = Column(String(32), nullable=False, index=True, default="pending")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    business_rep = relationship(
        "BusinessRepresentative",
        back_populates="clusters",
        lazy="selectin",
    )
    places = relationship(
        "Place",
        back_populates="cluster",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Cluster id={self.id!r} title={self.title!r} status={self.status!r}>"
