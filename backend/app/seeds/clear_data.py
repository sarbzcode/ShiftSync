import asyncio
from typing import Iterable

from app.config import settings
import app.database as database

COLLECTIONS: Iterable[str] = (
    "attendance",
    "deleted_employees",
    "breaks",
    "pay",
    "payroll",
    "shifts",
    "users",
)


async def clear_collections() -> None:
    await database.init_db()
    if database.client is None:
        raise RuntimeError("Mongo client is not initialized")

    db = database.client[settings.DB_NAME]
    for name in COLLECTIONS:
        result = await db[name].delete_many({})
        print(f"Cleared {name}: deleted {result.deleted_count} documents")

    await database.close_db()


if __name__ == "__main__":
    asyncio.run(clear_collections())
