from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, Literal

class AttendanceStart(BaseModel):
    pass  # No input needed, uses current user and time

class AttendanceEnd(BaseModel):
    pass  # No input needed, uses current user and time

class AttendanceResponse(BaseModel):
    id: str
    user_id: str
    clock_in: datetime
    clock_out: Optional[datetime]
    hours_worked: Optional[float]
    date: date

class AttendanceSummary(BaseModel):
    total_hours_today: float
    total_hours_week: float
    records: list[AttendanceResponse]

class AttendanceLogEntry(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    clock_in: datetime
    clock_out: Optional[datetime]
    expected_clock_out: datetime
    status: Literal["active", "completed"]
