import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from bson import ObjectId

def _load_env(env_path: Path):
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line.replace("export ", "", 1)
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())

def _add_project_root():
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / ".env").exists() and (parent / "backend").exists():
            # ensure both project root and backend package path are importable
            if str(parent) not in sys.path:
                sys.path.insert(0, str(parent))
            backend_path = parent / "backend"
            if str(backend_path) not in sys.path:
                sys.path.insert(0, str(backend_path))
            _load_env(parent / ".env")
            _load_env(parent / "backend" / ".env")
            return parent
    fallback = current.parents[3]
    if str(fallback) not in sys.path:
        sys.path.insert(0, str(fallback))
    backend_path = fallback / "backend"
    if str(backend_path) not in sys.path:
        sys.path.insert(0, str(backend_path))
    _load_env(fallback / ".env")
    _load_env(fallback / "backend" / ".env")
    return fallback

PROJECT_ROOT = _add_project_root()

from app.database import init_db  # type: ignore  # noqa: E402
from app.models.shift import Shift  # type: ignore  # noqa: E402
from app.models.attendance import Attendance  # type: ignore  # noqa: E402
from app.services.system_settings import get_system_timezone  # type: ignore  # noqa: E402


def _build_shift_datetime(shift_date, time_str, tz):
    hours, minutes = map(int, time_str.split(":"))
    return datetime(
        shift_date.year,
        shift_date.month,
        shift_date.day,
        hours,
        minutes,
        tzinfo=tz,
    )


async def seed_attendance_from_shifts() -> None:
    """
    Create attendance records for every completed shift that is missing attendance.
    Existing attendance entries with the same user_id and clock_in are left untouched.
    """
    await init_db()
    tz = await get_system_timezone()

    shifts: List[Shift] = await Shift.find(Shift.status == "completed").to_list()
    if not shifts:
        print("No completed shifts found.")
        return

    created = 0
    skipped_existing = 0
    skipped_invalid = 0

    for shift in shifts:
        clock_in_dt = _build_shift_datetime(shift.shift_date, shift.start_time, tz)
        clock_out_dt = _build_shift_datetime(shift.shift_date, shift.end_time, tz)

        if clock_out_dt <= clock_in_dt:
            skipped_invalid += 1
            continue

        existing = await Attendance.find_one(
            Attendance.user_id == ObjectId(shift.employee_id),
            Attendance.clock_in == clock_in_dt,
        )
        if existing:
            skipped_existing += 1
            continue

        hours = round((clock_out_dt - clock_in_dt).total_seconds() / 3600, 2)
        attendance = Attendance(
            user_id=shift.employee_id,
            clock_in=clock_in_dt,
            clock_out=clock_out_dt,
            hours_worked=hours,
            date=shift.shift_date,
        )
        await attendance.insert()
        created += 1

    print(f"Completed shifts processed: {len(shifts)}")
    print(f"Attendance created: {created}")
    print(f"Skipped existing: {skipped_existing}")
    print(f"Skipped invalid time ranges: {skipped_invalid}")


if __name__ == "__main__":
    asyncio.run(seed_attendance_from_shifts())
