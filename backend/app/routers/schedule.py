import calendar
from datetime import date, datetime
from zoneinfo import ZoneInfo
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId

from app.models.user import User
from app.models.shift import Shift
from app.models.attendance import Attendance
from app.schemas.shift import (
    ShiftCreate,
    ShiftResponse,
    ShiftUpdate,
    ShiftWithEmployeeResponse,
)
from app.utils.deps import require_admin, get_current_user
from app.services.system_settings import get_current_date, get_system_timezone

router = APIRouter()

def _time_to_minutes(value: str) -> int:
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)

def _validate_time_window(start_time: str, end_time: str) -> None:
    if _time_to_minutes(start_time) >= _time_to_minutes(end_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be later than start time",
        )

async def _validate_employee(employee_id: str) -> User:
    try:
        object_id = ObjectId(employee_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID format",
        )

    employee = await User.get(object_id)
    if not employee or employee.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return employee

def _build_shift_datetime(shift_date: date, time_str: str, tz: ZoneInfo) -> datetime:
    hours, minutes = map(int, time_str.split(":"))
    return datetime(
        shift_date.year,
        shift_date.month,
        shift_date.day,
        hours,
        minutes,
        tzinfo=tz,
    )

async def _ensure_completed_shift_attendance(shift: Shift) -> None:
    """Ensure a completed shift has a matching attendance record for payroll."""
    tz = await get_system_timezone()
    clock_in_dt = _build_shift_datetime(shift.shift_date, shift.start_time, tz)
    clock_out_dt = _build_shift_datetime(shift.shift_date, shift.end_time, tz)

    if clock_out_dt <= clock_in_dt:
        return

    hours = round((clock_out_dt - clock_in_dt).total_seconds() / 3600, 2)

    existing = await Attendance.find_one(
        Attendance.user_id == shift.employee_id,
        Attendance.clock_in == clock_in_dt,
    )

    if existing:
        existing.clock_out = clock_out_dt
        existing.hours_worked = hours
        existing.date = shift.shift_date
        await existing.save()
        return

    attendance = Attendance(
        user_id=shift.employee_id,
        clock_in=clock_in_dt,
        clock_out=clock_out_dt,
        hours_worked=hours,
        date=shift.shift_date,
    )
    await attendance.insert()

def _serialize_shift(shift: Shift, employee: Optional[User]) -> ShiftWithEmployeeResponse:
    display_name = employee.name if employee else "Unknown Employee"
    display_email = employee.email if employee else ""
    display_username = employee.username if employee else None

    return ShiftWithEmployeeResponse(
        id=str(shift.id),
        employee_id=str(shift.employee_id),
        shift_date=shift.shift_date,
        start_time=shift.start_time,
        end_time=shift.end_time,
        status=shift.status,
        employee_name=display_name,
        employee_email=display_email,
        employee_username=display_username,
    )

def _normalize_range(
    start_date: Optional[date],
    end_date: Optional[date],
    reference: date,
) -> Tuple[date, date]:
    today = reference
    if start_date is None and end_date is None:
        start_date = date(today.year, today.month, 1)
        _, last_day = calendar.monthrange(today.year, today.month)
        end_date = date(today.year, today.month, last_day)
    elif start_date is None and end_date is not None:
        start_date = end_date
    elif start_date is not None and end_date is None:
        _, last_day = calendar.monthrange(start_date.year, start_date.month)
        end_date = date(start_date.year, start_date.month, last_day)

    if start_date is None or end_date is None:
        # This should never happen, but mypy requires a guard.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date range provided",
        )

    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date",
        )

    return start_date, end_date

@router.post(
    "/shifts",
    response_model=ShiftWithEmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_shift(shift_data: ShiftCreate, admin: User = Depends(require_admin)):
    """Create a new shift for an employee (Admin only)."""
    employee = await _validate_employee(shift_data.employee_id)
    _validate_time_window(shift_data.start_time, shift_data.end_time)

    shift = Shift(
        employee_id=employee.id,
        shift_date=shift_data.shift_date,
        start_time=shift_data.start_time,
        end_time=shift_data.end_time,
        status=shift_data.status,
    )

    await shift.insert()
    if shift.status == "completed":
        await _ensure_completed_shift_attendance(shift)
    return _serialize_shift(shift, employee)

@router.get("/shifts", response_model=List[ShiftWithEmployeeResponse])
async def list_shifts(
    start_date: Optional[date] = Query(
        None, description="Inclusive start date (YYYY-MM-DD)"
    ),
    end_date: Optional[date] = Query(
        None, description="Inclusive end date (YYYY-MM-DD)"
    ),
    admin: User = Depends(require_admin),
):
    """List shifts for a given date range to populate the calendar."""
    reference_today = await get_current_date()
    start, end = _normalize_range(start_date, end_date, reference_today)

    query = Shift.find(
        Shift.shift_date >= start,
        Shift.shift_date <= end,
    ).sort("+shift_date", "+start_time")

    shifts = await query.to_list()
    employee_map: Dict[ObjectId, User] = {}

    if shifts:
        employee_ids = list({shift.employee_id for shift in shifts})
        employees = await User.find({"_id": {"$in": employee_ids}}).to_list()
        employee_map = {employee.id: employee for employee in employees}

    return [_serialize_shift(shift, employee_map.get(shift.employee_id)) for shift in shifts]

@router.put("/shifts/{shift_id}", response_model=ShiftWithEmployeeResponse)
async def update_shift(
    shift_id: str,
    shift_data: ShiftUpdate,
    admin: User = Depends(require_admin),
):
    """Update an existing shift."""
    try:
        shift_object_id = ObjectId(shift_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid shift ID format",
        )

    shift = await Shift.get(shift_object_id)
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )

    update_values = shift_data.model_dump(exclude_none=True)
    if not update_values:
        employee = await User.get(shift.employee_id)
        return _serialize_shift(shift, employee)

    new_employee: Optional[User] = None
    if "employee_id" in update_values:
        new_employee = await _validate_employee(update_values["employee_id"])
        shift.employee_id = new_employee.id

    if "shift_date" in update_values:
        shift.shift_date = update_values["shift_date"]

    updated_start = update_values.get("start_time")
    updated_end = update_values.get("end_time")

    if updated_start:
        shift.start_time = updated_start
    if updated_end:
        shift.end_time = updated_end

    if updated_start or updated_end:
        _validate_time_window(shift.start_time, shift.end_time)

    if "status" in update_values:
        shift.status = update_values["status"]

    await shift.save()
    if shift.status == "completed":
        await _ensure_completed_shift_attendance(shift)

    employee = new_employee or await User.get(shift.employee_id)
    return _serialize_shift(shift, employee)

@router.get("/my", response_model=List[ShiftResponse])
async def get_my_shifts(current_user: User = Depends(get_current_user)):
    """Get shifts for current employee."""
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can view their shifts"
        )
    
    shifts = await Shift.find(
        Shift.employee_id == current_user.id
    ).sort("-shift_date").to_list()
    
    return [
        ShiftResponse(
            id=str(shift.id),
            employee_id=str(shift.employee_id),
            shift_date=shift.shift_date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            status=shift.status
        )
        for shift in shifts
    ]
