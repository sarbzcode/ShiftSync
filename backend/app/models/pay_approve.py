from beanie import Document
from bson import ObjectId
from datetime import datetime, date, timezone
from typing import Literal, Optional
from pydantic import Field


class PayApprove(Document):
    user_id: ObjectId
    week_start: date
    week_end: date
    hours_worked: float
    gross_amount: float = Field(default=0)
    amount: float
    adjustments: list[dict] = Field(default_factory=list)
    status: Literal['pending', 'held'] = 'pending'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = 'payapprove'
        indexes = [
            'user_id',
            'status',
            ('week_start', 'week_end'),
        ]

    class Config:
        arbitrary_types_allowed = True
        json_schema_extra = {
            'example': {
                'user_id': '507f1f77bcf86cd799439011',
                'week_start': '2025-09-13',
                'week_end': '2025-09-19',
                'hours_worked': 42.5,
                'amount': 1215.63,
                'status': 'pending',
            }
        }
