"""Сервис для работы с DeepSeek API (embeddings)."""

from __future__ import annotations

import logging
from typing import List

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


def get_embedding(text: str) -> List[float] | None:
    """
    Получает эмбеддинг текста через DeepSeek API.
    Returns None при ошибке или отсутствии API key.
    """
    if not settings.DEEPSEEK_API_KEY:
        logger.warning("DEEPSEEK_API_KEY not set, embedding skipped")
        return None

    text = (text or "").strip()
    if not text:
        return None

    url = f"{settings.DEEPSEEK_BASE_URL.rstrip('/')}/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.DEEPSEEK_EMBEDDING_MODEL,
        "input": text[:8000],  # лимит по длине
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.exception("DeepSeek embedding request failed: %s", e)
        return None

    # OpenAI-compatible format: {"data": [{"embedding": [...]}]}
    items = data.get("data") or []
    if not items:
        logger.warning("DeepSeek returned empty embeddings")
        return None

    emb = items[0].get("embedding")
    if not isinstance(emb, list):
        return None
    return [float(x) for x in emb]
