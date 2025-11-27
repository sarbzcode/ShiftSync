from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TimezoneUpdate(BaseModel):
    timezone: str = Field(..., description="IANA timezone, e.g., America/New_York")


class TimezoneResponse(BaseModel):
    timezone: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    updated_by_name: Optional[str] = None


class TimezoneListResponse(BaseModel):
    timezones: List[str]


class CurrencyUpdate(BaseModel):
    currency: str = Field(..., description="ISO 4217 currency code, e.g., USD")


class CurrencyResponse(BaseModel):
    currency: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    updated_by_name: Optional[str] = None


class CurrencyOption(BaseModel):
    code: str = Field(..., description="ISO 4217 currency code")
    name: str = Field(..., description="Human-friendly currency name")


class CurrencyListResponse(BaseModel):
    currencies: List[CurrencyOption]


class BudgetResponse(BaseModel):
    budget: Optional[float]
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    updated_by_name: Optional[str] = None


class BudgetUpdate(BaseModel):
    budget: float
