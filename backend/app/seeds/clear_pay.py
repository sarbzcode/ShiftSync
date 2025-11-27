import asyncio

import app.database as database
from app.config import settings


async def clear_pay() -> None:
    await database.init_db()
    if database.client is None:
        raise RuntimeError("Mongo client is not initialized")

    db = database.client[settings.DB_NAME]

    pay_result = await db["pay"].delete_many({})
    print(f"Cleared pay: deleted {pay_result.deleted_count} documents")

    await database.close_db()


if __name__ == "__main__":
    asyncio.run(clear_pay())
