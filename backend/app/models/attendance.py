from beanie import Document
from pydantic import Field, field_validator
from datetime import datetime, date, timezone
from typing import Optional, Union
from bson import ObjectId

class Attendance(Document):
    user_id: ObjectId
    clock_in: datetime
    clock_out: Optional[datetime] = None
    hours_worked: Optional[float] = None
    date: date
    
    @field_validator('clock_in', 'clock_out', mode='before')
    @classmethod
    def ensure_timezone(cls, value: Optional[Union[datetime, str]]):
        if value is None:
            return value
        if isinstance(value, str):
            iso_value = value.replace("Z", "+00:00") if value.endswith("Z") else value
            value = datetime.fromisoformat(iso_value)
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    
    class Settings:
        name = "attendance"
        indexes = [
            "user_id",
            "date",
            "clock_in",
        ]
    
    class Config:
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "clock_in": "2024-01-15T08:00:00Z",
                "clock_out": "2024-01-15T17:00:00Z",
                "hours_worked": 9.0,
                "date": "2024-01-15"
            }
        }
