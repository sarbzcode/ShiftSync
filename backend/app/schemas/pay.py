from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class PayRecordResponse(BaseModel):
    id: str
    user_id: str
    employee_name: str
    week_start: date
    week_end: date
    hours_worked: float
    gross_amount: float
    amount: float
    adjustments: list[dict]
    status: str
    created_at: datetime


class PayApproveResponse(BaseModel):
    id: str
    status: str
    approved_by: Optional[str]
    week_start: date
    week_end: date


class PayGenerateResponse(BaseModel):
    generated: int
    weeks_processed: int


class PaySyncApproveResponse(BaseModel):
    synced_weeks: int
    approved: int
