from beanie import Document
from datetime import datetime, timezone
from typing import Literal
from bson import ObjectId
from pydantic import Field


class DeletedEmployee(Document):
    original_id: ObjectId
    username: str
    name: str
    email: str
    pay_rate: float
    status: Literal["active", "disabled"]
    deleted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "deleted_employees"
        indexes = [
            "deleted_at",
            "email",
        ]

    class Config:
        arbitrary_types_allowed = True
