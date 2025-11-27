from beanie import Document
from pydantic import Field
from datetime import date
from typing import Literal
from bson import ObjectId

class Shift(Document):
    employee_id: ObjectId
    shift_date: date
    start_time: str = Field(..., pattern=r'^([01]\d|2[0-3]):([0-5]\d)$')
    end_time: str = Field(..., pattern=r'^([01]\d|2[0-3]):([0-5]\d)$')
    status: Literal["assigned", "completed"] = "assigned"
    
    class Settings:
        name = "shifts"
        indexes = [
            "employee_id",
            "shift_date",
        ]
    
    class Config:
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "employee_id": "507f1f77bcf86cd799439011",
                "shift_date": "2024-01-15",
                "start_time": "09:00",
                "end_time": "17:00",
                "status": "assigned"
            }
        }
