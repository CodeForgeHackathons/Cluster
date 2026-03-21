from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.security import decode_access_token
from database.session import LocalSession
from models.business_rep_model import BusinessRepresentative

_bearer = HTTPBearer(auto_error=False)


def get_db():
    db = LocalSession()
    try:
        yield db
    finally:
        db.close()


def get_current_partner(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> BusinessRepresentative:
    """
    Извлекает текущего авторизованного партнёра из Bearer-токена.
    Бросает 401, если токен отсутствует, невалиден или партнёр не найден/неактивен.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация",
            headers={"WWW-Authenticate": "Bearer"},
        )

    partner_id = decode_access_token(credentials.credentials)
    if partner_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный или истёкший токен",
            headers={"WWW-Authenticate": "Bearer"},
        )

    partner = db.get(BusinessRepresentative, partner_id)
    if partner is None or not partner.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Партнёр не найден или деактивирован",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return partner
