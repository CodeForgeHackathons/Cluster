"""Сервис для работы с DeepSeek API (chat only).

ВАЖНО: DeepSeek НЕ поддерживает /v1/embeddings endpoint!
Для embeddings используем локальный TF-IDF поиск (см. place_search_service.py)
"""

from __future__ import annotations

import logging
from typing import List, Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


def get_embedding(text: str) -> Optional[List[float]]:
    """
    ❌ DEPRECATED: DeepSeek не поддерживает embeddings API.
    
    Эта функция всегда возвращает None.
    Используйте локальный TF-IDF поиск вместо этого.
    """
    logger.warning(
        "get_embedding() вызвана, но DeepSeek не поддерживает embeddings API. "
        "Используется локальный TF-IDF fallback в place_search_service.py"
    )
    return None


def call_deepseek_chat(prompt: str, model: Optional[str] = None) -> Optional[str]:
    """
    Делает запрос к DeepSeek chat API (для будущих фич).
    
    Args:
        prompt: Текстовый запрос
        model: Название модели (по умолчанию: deepseek-chat)
    
    Returns:
        Текст ответа или None при ошибке
    """
    if not settings.DEEPSEEK_API_KEY:
        logger.warning("DEEPSEEK_API_KEY not set, skipping DeepSeek chat call")
        return None

    if not model:
        model = settings.DEEPSEEK_CHAT_MODEL

    url = f"{settings.DEEPSEEK_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.exception("DeepSeek chat request failed: %s", e)
        return None

    # OpenAI-compatible format
    choices = data.get("choices") or []
    if not choices:
        logger.warning("DeepSeek returned empty choices")
        return None

    message = choices[0].get("message") or {}
    content = message.get("content")
    if not isinstance(content, str):
        return None
    return content
