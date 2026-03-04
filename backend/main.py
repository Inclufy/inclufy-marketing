import os
import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("inclufy_api")

from routers import (
    growth_blueprint,
    marketing_setup,
    campaigns,
    contacts,
    analytics,
    content_generation,
    brand_memory,
    export,
    email_sending,
    payments,
    content_library,
    admin,
    copilot,
    tenant_admin,
)

app = FastAPI(title="Inclufy Marketing API", version="1.0.0")

# CORS: restrict to known origins (override via ALLOWED_ORIGINS env var)
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.info(
        "%s %s -> %s (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.on_event("startup")
async def startup():
    logger.info("Inclufy Marketing API starting...")
    logger.info("API ready!")


@app.get("/")
async def root():
    return {"message": "Inclufy Marketing API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# Register routers
app.include_router(growth_blueprint.router)
app.include_router(marketing_setup.router)
app.include_router(campaigns.router)
app.include_router(contacts.router)
app.include_router(analytics.router)
app.include_router(content_generation.router)
app.include_router(brand_memory.router)
app.include_router(export.router)
app.include_router(email_sending.router)
app.include_router(payments.router)
app.include_router(content_library.router)
app.include_router(admin.router)
app.include_router(copilot.router)
app.include_router(tenant_admin.router)
