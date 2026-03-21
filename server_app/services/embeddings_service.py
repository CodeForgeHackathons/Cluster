"""Сервис для работы с embeddings из разных источников.

DeepSeek не поддерживает embeddings API, поэтому используем:
1. Локальный TF-IDF (бесплатный, встроенный)
2. OpenAI API (платный, требует ключ)
3. Другие сервисы (в будущем)
"""

from __future__ import annotations

import logging
from typing import List, Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


def get_embedding_from_openai(text: str) -> Optional[List[float]]:
    """
    Получает эмбеддинг текста через OpenAI API.
    
    Требует EMBEDDINGS_API_KEY и EMBEDDING_SERVICE=openai.
    """
    if not settings.EMBEDDINGS_API_KEY:
        logger.warning("EMBEDDINGS_API_KEY not set for OpenAI embeddings")
        return None

    text = (text or "").strip()
    if not text:
        return None

    url = "https://api.openai.com/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {settings.EMBEDDINGS_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "text-embedding-3-small",
        "input": text[:8191],  # OpenAI лимит для small модели
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("OpenAI embeddings HTTP error: %s", e.response.text)
        return None
    except Exception as e:
        logger.exception("OpenAI embedding request failed: %s", e)
        return None

    # OpenAI format: {"data": [{"embedding": [...]}]}
    items = data.get("data") or []
    if not items:
        logger.warning("OpenAI returned empty embeddings")
        return None

    emb = items[0].get("embedding")
    if not isinstance(emb, list):
        logger.warning("OpenAI returned invalid embedding format")
        return None
    
    return [float(x) for x in emb]


def get_embedding(text: str) -> Optional[List[float]]:
    """
    Получает эмбеддинг текста в зависимости от конфигурации.
    
    Приоритет:
    1. OpenAI API (если EMBEDDING_SERVICE=openai и EMBEDDINGS_API_KEY установлен)
    2. Локальный TF-IDF (встроенный fallback)
    """
    # Проверяем, нужны ли embeddings вообще
    if settings.EMBEDDING_SERVICE == "local_tfidf":
        # Локальный TF-IDF будет использоваться в place_search_service.py
        return None
    
    if settings.EMBEDDING_SERVICE == "openai":
        return get_embedding_from_openai(text)
    
    # Неизвестный сервис
    logger.warning("Unknown EMBEDDING_SERVICE: %s, using local TF-IDF", settings.EMBEDDING_SERVICE)
    return None
