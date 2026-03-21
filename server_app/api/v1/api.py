from fastapi import APIRouter

from api.v1.endpoints.place_endpoints import router as places_router
from api.v1.endpoints.cluster_endpoints import router as clusters_router
from api.v1.endpoints.itinerary_endpoints import router as itinerary_router
from api.v1.endpoints.partner_endpoints import router as partner_router
from api.v1.endpoints.partner_auth_endpoints import router as partner_auth_router

api_router = APIRouter()

api_router.include_router(places_router)
api_router.include_router(clusters_router)
api_router.include_router(itinerary_router)
api_router.include_router(partner_auth_router)
api_router.include_router(partner_router)
