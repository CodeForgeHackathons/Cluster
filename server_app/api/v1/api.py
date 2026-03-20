from fastapi import APIRouter

from api.v1.endpoints.place_endpoints import router as places_router

api_router = APIRouter()

api_router.include_router(places_router)