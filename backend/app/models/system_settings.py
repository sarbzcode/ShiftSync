from beanie import Document
from bson import ObjectId
from datetime import datetime, timezone
from pydantic import Field
from pydantic.config import ConfigDict
from typing import Optional


class SystemSettings(Document):
    timezone: str = "UTC"
    currency: str = "USD"
    updated_by: Optional[ObjectId] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    currency_updated_by: Optional[ObjectId] = None
    currency_updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    quarterly_budget: Optional[float] = None
    quarterly_budget_updated_by: Optional[ObjectId] = None
    quarterly_budget_updated_at: Optional[datetime] = None

    class Settings:
        name = "system_settings"

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "timezone": "America/New_York",
                "currency": "USD",
                "updated_by": "507f1f77bcf86cd799439011",
                "updated_at": "2024-01-15T12:00:00Z",
                "currency_updated_by": "507f1f77bcf86cd799439011",
                "currency_updated_at": "2024-01-15T12:00:00Z",
            }
        },
    )
