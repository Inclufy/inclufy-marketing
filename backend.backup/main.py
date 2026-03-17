from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables FIRST
load_dotenv()

# Import routers
from routers import growth_blueprint, marketing_setup

# Create FastAPI app
app = FastAPI(
    title="Inclufy Marketing API",
    description="AI-powered marketing intelligence platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: ["http://localhost:8080"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
def startup_event():
    print("🚀 Inclufy Marketing API starting...")
    print("✅ API is ready!")

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Inclufy Marketing API",
        "version": "1.0.0",
        "status": "running"
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(growth_blueprint.router)
app.include_router(marketing_setup.router)

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Global error: {exc}")
    return {
        "error": str(exc),
        "type": type(exc).__name__
    }
