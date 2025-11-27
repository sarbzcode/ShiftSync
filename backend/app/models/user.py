from beanie import Document
from pydantic import EmailStr, Field
from datetime import datetime, timezone
from typing import Literal, Optional

class User(Document):
    username: str = Field(..., min_length=4, max_length=20)
    password_hash: str
    role: Literal["admin", "employee"]
    name: str
    email: EmailStr
    pay_rate: float = Field(..., ge=0)
    status: Literal["active", "disabled"] = "active"
    department: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "users"
        indexes = [
            "username",
            "email",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "jdoe",
                "name": "John Doe",
                "email": "jdoe@example.com",
                "role": "employee",
                "pay_rate": 25.0,
                "status": "active"
            }
        }
