from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable, Optional

_NEUTRAL_TEXT = "Описание проверено и приведено к нейтральному виду."
_NEUTRAL_TITLE = "Новая локация"
_NEUTRAL_META = "Локация без уточнений"
_NEUTRAL_FACT = "Интересный факт"


@dataclass(frozen=True)
class SanitizeResult:
    original: str
    sanitized: str
    changed: bool
    is_meaningful: bool
    reason: Optional[str] = None


def _normalize(text: str) -> str:
    text = text or ""
    text = text.strip()
    # Replace repeated whitespace
    text = re.sub(r"\s+", " ", text)
    # Remove excessive punctuation runs
    text = re.sub(r"([!?.,])\1{2,}", r"\1\1", text)
    # Collapse repeated words (very simple heuristic)
    text = re.sub(r"\b(\w+)( \1\b){2,}", r"\1", text, flags=re.IGNORECASE)
    return text


def _has_min_words(text: str, min_words: int) -> bool:
    words = re.findall(r"[a-zA-Zа-яА-ЯёЁ0-9]+", text)
    return len(words) >= min_words


def _looks_like_gibberish(text: str) -> bool:
    if not text:
        return True
    # Too many non-letter symbols
    letters = re.findall(r"[a-zA-Zа-яА-ЯёЁ]", text)
    symbols = re.findall(r"[^a-zA-Zа-яА-ЯёЁ0-9\s]", text)
    if letters and len(symbols) / max(len(text), 1) > 0.35:
        return True
    # Very long word suggests noise
    if re.search(r"[a-zA-Zа-яА-ЯёЁ]{25,}", text):
        return True
    return False


def sanitize_text(
    text: str,
    *,
    min_words: int = 2,
    max_len: int = 600,
    fallback: Optional[str] = None,
) -> SanitizeResult:
    original = text or ""
    normalized = _normalize(original)

    if not normalized:
        return SanitizeResult(original, fallback or _NEUTRAL_TEXT, True, False, "empty")

    if len(normalized) > max_len:
        normalized = normalized[:max_len].rstrip() + "…"

    meaningful = _has_min_words(normalized, min_words) and not _looks_like_gibberish(
        normalized
    )

    if not meaningful:
        return SanitizeResult(
            original, fallback or _NEUTRAL_TEXT, True, False, "low-meaning"
        )

    changed = normalized != original
    return SanitizeResult(original, normalized, changed, True, None)


def sanitize_title(text: str) -> SanitizeResult:
    return sanitize_text(text, min_words=1, max_len=120, fallback=_NEUTRAL_TITLE)


def sanitize_meta(text: str) -> SanitizeResult:
    return sanitize_text(text, min_words=1, max_len=160, fallback=_NEUTRAL_META)


def sanitize_description(text: str) -> SanitizeResult:
    return sanitize_text(text, min_words=4, max_len=900, fallback=_NEUTRAL_TEXT)


def sanitize_fact(text: str) -> SanitizeResult:
    return sanitize_text(text, min_words=1, max_len=120, fallback=_NEUTRAL_FACT)


def sanitize_fields(
    *,
    title: Optional[str] = None,
    meta: Optional[str] = None,
    description: Optional[str] = None,
    interesting_fact: Optional[str] = None,
) -> dict[str, SanitizeResult]:
    results = {}
    if title is not None:
        results["title"] = sanitize_title(title)
    if meta is not None:
        results["meta"] = sanitize_meta(meta)
    if description is not None:
        results["description"] = sanitize_description(description)
    if interesting_fact is not None:
        results["interesting_fact"] = sanitize_fact(interesting_fact)
    return results


def any_changed(results: Iterable[SanitizeResult]) -> bool:
    return any(r.changed for r in results)


def any_not_meaningful(results: Iterable[SanitizeResult]) -> bool:
    return any(not r.is_meaningful for r in results)
