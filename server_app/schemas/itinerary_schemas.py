"""Схемы для генерации маршрута (itinerary)."""

from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field


# --- Request (что приходит с фронта) ---

class WeatherDayInput(BaseModel):
    weatherCode: int = 0
    minTemp: float = 0.0
    maxTemp: float = 0.0
    precipitationSum: float = 0.0
    isRainy: bool = False
    weatherLabel: str = ""


class CoordinatesInput(BaseModel):
    lat: float
    lon: float


class SuitabilityFlagsInput(BaseModel):
    kidsFriendly: Optional[bool] = None
    elderlyFriendly: Optional[bool] = None
    wifi: Optional[bool] = None
    accessibilityNotes: Optional[str] = None


class CandidateInput(BaseModel):
    id: str
    clusterId: str
    title: str
    location: str
    coordinates: CoordinatesInput
    rating: float = 0.0
    cost: float = 0.0
    fact: str = ""
    description: str = ""
    seasonsBest: List[str] = Field(default_factory=list)
    availableMonths: List[str] = Field(default_factory=list)
    typeTags: List[str] = Field(default_factory=list)
    indoorOptions: List[str] = Field(default_factory=list)
    outdoorOptions: List[str] = Field(default_factory=list)
    suitabilityFlags: Optional[SuitabilityFlagsInput] = None


class OutputContractInput(BaseModel):
    daysCount: int = 3
    daySlots: List[str] = Field(default_factory=lambda: ["Утро", "День", "Вечер"])
    maxPlacesPerDay: int = 3
    language: str = "ru"


class ItineraryGenerateRequest(BaseModel):
    requestType: str = "itinerary_generation"
    travelerType: str = "family"
    startDate: str
    durationDays: int = 3
    weatherByDay: List[WeatherDayInput] = Field(default_factory=list)
    candidates: List[CandidateInput] = Field(default_factory=list)
    outputContract: Optional[OutputContractInput] = None


# --- Response (что возвращаем фронту) ---

class PlaceInfoInStep(BaseModel):
    """Данные места при поиске из БД (когда нет candidates с фронта)."""
    id: str
    title: str
    location: str = ""
    cost: float = 0.0
    rating: float = 0.0
    fact: str = ""
    description: str = ""
    photoUrl: str = ""


class ItineraryStep(BaseModel):
    slot: str
    placeId: str
    why: str
    logisticsNotes: str = ""
    placeInfo: Optional[PlaceInfoInStep] = None  # при поиске из БД


class ItineraryDay(BaseModel):
    dayIndex: int
    steps: List[ItineraryStep] = Field(default_factory=list)


class ItineraryGenerateResponse(BaseModel):
    itineraryDays: List[ItineraryDay] = Field(default_factory=list)
    overallWhy: str = ""
