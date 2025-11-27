from beanie import Document
from pydantic import Field
from datetime import datetime, date, timezone
from typing import Literal, Optional
from bson import ObjectId

class Payroll(Document):
    user_id: ObjectId
    period_start: date
    period_end: date
    total_hours: float
    gross_pay: float
    status: Literal["pending", "approved"] = "pending"
    approved_by: Optional[ObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "payroll"
        indexes = [
            "user_id",
            "status",
            "period_start",
            "period_end",
        ]
    
    class Config:
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "period_start": "2024-01-01",
                "period_end": "2024-01-14",
                "total_hours": 80.0,
                "gross_pay": 2000.0,
                "status": "pending"
            }
        }
