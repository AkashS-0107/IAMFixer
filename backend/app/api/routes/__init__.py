from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.telemetry import router as telemetry_router
from app.api.routes.investigation import router as investigation_router
from app.api.routes.simulation import router as simulation_router

__all__ = [
    "health_router",
    "incidents_router",
    "telemetry_router",
    "investigation_router",
    "simulation_router",
]
