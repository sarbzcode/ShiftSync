from pydantic import BaseModel, Field
from datetime import date
from typing import Literal, Optional

class ShiftCreate(BaseModel):
    employee_id: str
    shift_date: date
    start_time: str = Field(..., pattern=r'^([01]\d|2[0-3]):([0-5]\d)$')
    end_time: str = Field(..., pattern=r'^([01]\d|2[0-3]):([0-5]\d)$')
    status: Literal["assigned", "completed"] = "assigned"
    
    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": "507f1f77bcf86cd799439011",
                "shift_date": "2024-01-20",
                "start_time": "09:00",
                "end_time": "17:00",
                "status": "completed"
            }
        }

class ShiftResponse(BaseModel):
    id: str
    employee_id: str
    shift_date: date
    start_time: str
    end_time: str
    status: Literal["assigned", "completed"]

class ShiftUpdate(BaseModel):
    employee_id: Optional[str] = None
    shift_date: Optional[date] = None
    start_time: Optional[str] = Field(None, pattern=r'^([01]\d|2[0-3]):([0-5]\d)$')
    end_time: Optional[str] = Field(None, pattern=r'^([01]\d|2[0-3]):([0-5]\d)$')
    status: Optional[Literal["assigned", "completed"]] = None

class ShiftWithEmployeeResponse(ShiftResponse):
    employee_name: str
    employee_email: str
    employee_username: Optional[str] = None
