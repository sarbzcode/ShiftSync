from pydantic import BaseModel
from datetime import datetime, date
from typing import Literal, Optional

class PayrollResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    period_start: date
    period_end: date
    total_hours: float
    gross_pay: float
    status: Literal["pending", "approved"]
    approved_by: Optional[str] = None
    created_at: datetime

class PayrollApprove(BaseModel):
    pass  # No input needed, uses current admin user
