from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.database import init_db
from app.routers import auth, users, attendance, payroll, schedule, dashboard
from app.routers import pay
from app.routers import settings as settings_router
from app.routers import adjustments
from app.utils.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting ShiftSync API...")
    await init_db()
    start_scheduler()
    logger.info("ShiftSync API started successfully")
    yield
    # Shutdown
    logger.info("Shutting down ShiftSync API...")
    shutdown_scheduler()
    logger.info("ShiftSync API shut down")

app = FastAPI(
    title="ShiftSync API",
    description="Workforce management system for attendance, scheduling, and payroll",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://localhost:8081",  # Expo web
        "http://localhost:19006",
        "exp://*",  # Allow Expo Go for mobile
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(payroll.router, prefix="/payroll", tags=["Payroll"])
app.include_router(schedule.router, prefix="/schedule", tags=["Schedule"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(pay.router, prefix="/pay", tags=["Pay"])
app.include_router(settings_router.router, prefix="/settings", tags=["Settings"])
app.include_router(adjustments.router, prefix="/adjustments", tags=["Adjustments"])

@app.get("/")
async def root():
    return {"message": "ShiftSync API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
