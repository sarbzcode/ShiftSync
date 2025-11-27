from __future__ import annotations

from typing import Optional
import logging

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.user import User
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.models.pay import Pay
from app.models.pay_approve import PayApprove
from app.models.shift import Shift
from app.models.deleted_employee import DeletedEmployee
from app.models.system_settings import SystemSettings
from app.models.adjustment import AdjustmentType, EmployeeAdjustment

logger = logging.getLogger(__name__)

client: Optional[AsyncIOMotorClient] = None


async def init_db():
    global client
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        database = client[settings.DB_NAME]

        await init_beanie(
            database=database,
            document_models=[
                User,
                Attendance,
                Payroll,
                Shift,
                DeletedEmployee,
                SystemSettings,
                Pay,
                PayApprove,
                AdjustmentType,
                EmployeeAdjustment,
            ],
            allow_index_dropping=True,
        )

        logger.info("Connected to MongoDB database: %s", settings.DB_NAME)
    except Exception as exc:
        logger.error("Failed to connect to MongoDB: %s", exc)
        raise


async def close_db():
    global client
    if client:
        client.close()
        logger.info("Closed MongoDB connection")
