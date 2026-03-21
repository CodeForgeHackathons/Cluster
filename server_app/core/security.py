"""Утилиты безопасности: хэширование паролей и JWT-токены."""

from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt

from core.config import settings

# --------------------------------------------------------------------------- #
# Пароли (PBKDF2-HMAC-SHA256 через stdlib)                                    #
# --------------------------------------------------------------------------- #

_ITERATIONS = 260_000
_HASH_ALG = "sha256"


def hash_password(password: str) -> str:
    """Возвращает строку вида  salt$hash  (hex)."""
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac(_HASH_ALG, password.encode(), salt.encode(), _ITERATIONS)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Проверяет пароль против сохранённого хэша."""
    try:
        salt, dk_hex = stored_hash.split("$", 1)
    except ValueError:
        return False
    dk = hashlib.pbkdf2_hmac(_HASH_ALG, password.encode(), salt.encode(), _ITERATIONS)
    return hmac.compare_digest(dk.hex(), dk_hex)


# --------------------------------------------------------------------------- #
# JWT                                                                          #
# --------------------------------------------------------------------------- #

_ALGORITHM = "HS256"
_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней


def create_access_token(subject: int, extra: dict | None = None) -> str:
    """Создаёт JWT с sub=<partner_id>."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict = {"sub": str(subject), "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    """
    Декодирует токен и возвращает partner_id.
    Возвращает None при любой ошибке.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[_ALGORITHM])
        return int(payload["sub"])
    except Exception:
        return None
