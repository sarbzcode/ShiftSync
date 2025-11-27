from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class AdjustmentTypeCreate(BaseModel):
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


class AdjustmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    direction: Optional[Literal["add", "deduct"]] = None
    mode: Optional[Literal["percent", "flat"]] = None
    rate_or_amount: Optional[float] = None
    cap_per_period: Optional[float | None] = Field(default=None)
    apply_on: Optional[Literal["all", "overtime_only"]] = None
    overtime_rule: Optional[Literal["none", "8h_day", "40h_week"]] = None
    applies_globally: Optional[bool] = None
    note: Optional[str | None] = Field(default=None)
    effective_start: Optional[date] = None
    effective_end: Optional[date] = None


class AdjustmentTypeResponse(BaseModel):
    id: str
    name: str
    direction: str
    mode: str
    rate_or_amount: float
    cap_per_period: Optional[float]
    apply_on: str
    overtime_rule: Optional[str]
    applies_globally: bool
    note: Optional[str]
    effective_start: Optional[date]
    effective_end: Optional[date]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class EmployeeAdjustmentCreate(BaseModel):
    adjustment_type_id: str
    override_rate_or_amount: Optional[float] = None
    override_cap: Optional[float] = Field(default=None)
    replace_global: bool = False
    status: Literal["active", "paused"] = "active"
    note: Optional[str] = Field(default=None)
    effective_start: Optional[date] = None
    effective_end: Optional[date] = None


class EmployeeAdjustmentUpdate(BaseModel):
    override_rate_or_amount: Optional[float] = None
    override_cap: Optional[float | None] = Field(default=None)
    replace_global: Optional[bool] = None
    status: Optional[Literal["active", "paused"]] = None
    note: Optional[str | None] = Field(default=None)
    effective_start: Optional[date] = None
    effective_end: Optional[date] = None


class EmployeeAdjustmentResponse(BaseModel):
    id: str
    adjustment_type_id: str
    employee_id: str
    override_rate_or_amount: Optional[float]
    override_cap: Optional[float]
    replace_global: bool
    status: str
    note: Optional[str]
    effective_start: Optional[date]
    effective_end: Optional[date]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

