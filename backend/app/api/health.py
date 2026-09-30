from fastapi import APIRouter

from app.schemas.health_response import HealthResponse

health_router = APIRouter(tags=["health"])


@health_router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse()
