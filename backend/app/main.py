from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import __version__
from app.api.routes import (
    health_router,
    incidents_router,
    investigation_router,
    simulation_router,
    telemetry_router,
)
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger


from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting IAMFixer Backend v{__version__} in environment '{settings.environment}'")
    init_db()
    yield
    logger.info("Shutting down IAMFixer Backend")


app = FastAPI(
    title="IAMFixer — Intelligent Application Monitoring & Fixer",
    description="AI-powered incident response platform API that detects, investigates, and fixes software failures using logs, metrics, and deployment evidence.",
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
register_exception_handlers(app)

# Include Routers
app.include_router(health_router)
app.include_router(incidents_router)
app.include_router(telemetry_router)
app.include_router(investigation_router)
app.include_router(simulation_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
