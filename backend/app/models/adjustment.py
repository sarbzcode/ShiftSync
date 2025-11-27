from datetime import datetime, date, timezone
from typing import Literal, Optional

from beanie import Document
from bson import ObjectId
from pydantic import Field


class AdjustmentType(Document):
    name: str
    direction: Literal["add", "deduct"]
    mode: Literal["percent", "flat"]
    rate_or_amount: float
    cap_per_period: Optional[float] = None
    apply_on: Literal["all", "overtime_only"] = "all"
    overtime_rule: Optional[Literal["none", "8h_day", "40h_week"]] = "none"
    applies_globally: bool = False
    note: Optional[str] = None
    effective_start: Optional[date] = None
    effective_end: Optional[date] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "adjustment_types"
        indexes = ["name", "applies_globally"]

    class Config:
        arbitrary_types_allowed = True


class EmployeeAdjustment(Document):
    employee_id: ObjectId
    adjustment_type_id: ObjectId
    override_rate_or_amount: Optional[float] = None
    override_cap: Optional[float] = None
    replace_global: bool = False
    status: Literal["active", "paused"] = "active"
    note: Optional[str] = None
    effective_start: Optional[date] = None
    effective_end: Optional[date] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "employee_adjustments"
        indexes = ["employee_id", "adjustment_type_id", "status"]

    class Config:
        arbitrary_types_allowed = True
