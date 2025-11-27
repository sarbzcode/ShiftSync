from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # MongoDB
    MONGODB_URI: str
    DB_NAME: str = "shiftsync"
    
    # JWT Settings
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_AUDIENCE: str = "shiftsync"
    JWT_EXPIRE_MINUTES: int = 30
    
    # Admin Seed
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "Admin@12345"
    ADMIN_EMAIL: str = "admin@shiftsync.local"
    ADMIN_NAME: str = "ShiftSync Admin"
    
    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    
    # Budgeting
    MONTHLY_LABOR_BUDGET: float = 75000.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
