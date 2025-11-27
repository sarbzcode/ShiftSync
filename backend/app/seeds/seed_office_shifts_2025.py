import asyncio
import random
import datetime
import sys
from pathlib import Path
from typing import List

from bson import ObjectId

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.database import init_db
from app.models.shift import Shift
from app.models.user import User

office_usernames = [
    "michaelscott",
    "dwightschrute",
    "jimhalpert",
    "pambeesly",
    "ryanhoward",
    "kellykapoor",
    "angelamartin",
    "oscarmartinez",
    "kevinmalone",
    "stanleyhudson",
    "phyllisvance",
    "creedbratton",
    "tobyflenderson",
    "andybernard",
    "darrylphilbin",
]


async def load_office_employee_ids() -> List[ObjectId]:
    employees = await User.find({"username": {"$in": office_usernames}}).to_list()
    return [emp.id for emp in employees]


def iter_weekdays(year: int, month: int):
    start = datetime.date(year, month, 1)
    if month == 12:
        end = datetime.date(year + 1, 1, 1)
    else:
        end = datetime.date(year, month + 1, 1)

    current = start
    while current < end:
        if current.weekday() < 5:  # Monday=0 ... Friday=4
            yield current
        current += datetime.timedelta(days=1)


async def seed_office_shifts_2025() -> None:
    await init_db()
    employee_ids = await load_office_employee_ids()

    if len(employee_ids) < 10:
        raise RuntimeError(f"Need at least 10 Office employees to schedule, found {len(employee_ids)}")

    shifts = []
    november_days = list(iter_weekdays(2025, 11))
    december_days = list(iter_weekdays(2025, 12))

    for day in november_days:
        selected = random.sample(employee_ids, 10)
        status = "completed"
        for emp_id in selected:
            shifts.append(
                Shift(
                    employee_id=emp_id,
                    shift_date=day,
                    start_time="09:00",
                    end_time="17:00",
                    status=status,
                )
            )

    for day in december_days:
        selected = random.sample(employee_ids, 10)
        status = "assigned"
        for emp_id in selected:
            shifts.append(
                Shift(
                    employee_id=emp_id,
                    shift_date=day,
                    start_time="09:00",
                    end_time="17:00",
                    status=status,
                )
            )

    if not shifts:
        print("No shifts generated.")
        return

    result = await Shift.insert_many(shifts)
    inserted_count = len(result.inserted_ids) if hasattr(result, "inserted_ids") else len(shifts)
    print(f"Inserted {inserted_count} total Office shifts for 2025.")


if __name__ == "__main__":
    asyncio.run(seed_office_shifts_2025())
