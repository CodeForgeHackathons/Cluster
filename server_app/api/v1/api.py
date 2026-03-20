from fastapi import APIRouter

from api.v1.endpoints.place_endpoints import router as places_router
from api.v1.endpoints.itinerary_endpoints import router as itinerary_router

api_router = APIRouter()

api_router.include_router(places_router)
api_router.include_router(itinerary_router)