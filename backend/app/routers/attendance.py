from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Optional
from bson import ObjectId

from app.models.user import User
from app.models.attendance import Attendance
from app.models.shift import Shift
from app.schemas.attendance import (
    AttendanceStart,
    AttendanceEnd,
    AttendanceResponse,
    AttendanceSummary,
    AttendanceLogEntry,
)
from app.utils.deps import get_current_user, require_admin
from app.services.system_settings import get_current_date, get_current_time

router = APIRouter()
DEFAULT_SHIFT_HOURS = 8


def _build_attendance_response(record: Attendance) -> AttendanceResponse:
    """Convert attendance document to response model."""
    return AttendanceResponse(
        id=str(record.id),
        user_id=str(record.user_id),
        clock_in=record.clock_in,
        clock_out=record.clock_out,
        hours_worked=record.hours_worked,
        date=record.date,
    )


def _ensure_timezone_aware(value: Optional[datetime], *, field_name: str) -> datetime:
    """Ensure datetime objects include timezone info for safe arithmetic."""
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Attendance record missing {field_name}"
        )
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value

async def _mark_shift_attended(user_id: ObjectId, event_date: date) -> None:
    """Mark the user's shift for the day as completed if it exists."""
    shift = await Shift.find_one(
        Shift.employee_id == user_id,
        Shift.shift_date == event_date,
        Shift.status == "assigned",
        sort=[("start_time", 1)],
    )

    if shift:
        shift.status = "completed"
        await shift.save()


async def _get_employee_or_error(employee_id: str) -> User:
    """Fetch a valid employee document or raise HTTP error."""
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID format"
        )

    employee = await User.get(ObjectId(employee_id))
    if employee is None or employee.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    if employee.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify attendance for disabled employee"
        )

    return employee


@router.post("/start", response_model=AttendanceResponse)
async def clock_in(current_user: User = Depends(get_current_user)):
    """Clock in - start attendance tracking."""
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can clock in"
        )
    
    # Check if already clocked in (no clock_out)
    existing = await Attendance.find_one(
        Attendance.user_id == current_user.id,
        Attendance.clock_out == None
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already clocked in. Please clock out first."
        )
    
    # Create new attendance record
    now = await get_current_time()
    attendance = Attendance(
        user_id=current_user.id,
        clock_in=now,
        date=now.date()
    )
    
    await attendance.insert()
    await _mark_shift_attended(current_user.id, now.date())
    
    return _build_attendance_response(attendance)

@router.post("/end", response_model=AttendanceResponse)
async def clock_out(current_user: User = Depends(get_current_user)):
    """Clock out - end attendance tracking and calculate hours."""
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can clock out"
        )
    
    # Find active clock-in
    attendance = await Attendance.find_one(
        Attendance.user_id == current_user.id,
        Attendance.clock_out == None
    )
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not clocked in. Please clock in first."
        )
    
    # Update with clock out time
    now = await get_current_time()
    attendance.clock_out = now
    
    # Calculate hours worked
    clock_in_time = _ensure_timezone_aware(attendance.clock_in, field_name="clock_in")
    time_diff = now - clock_in_time
    hours = time_diff.total_seconds() / 3600
    attendance.hours_worked = round(hours, 2)
    
    await attendance.save()
    await _mark_shift_attended(current_user.id, now.date())
    
    return _build_attendance_response(attendance)

@router.get("/summary", response_model=AttendanceSummary)
async def get_attendance_summary(current_user: User = Depends(get_current_user)):
    """Get attendance summary for current user."""
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can view attendance"
        )
    
    today = await get_current_date()
    week_start = today - timedelta(days=today.weekday())
    
    # Get all attendance records for the week
    records = await Attendance.find(
        Attendance.user_id == current_user.id,
        Attendance.date >= week_start
    ).sort("-clock_in").to_list()

    # Always include any active (no clock_out) record even if it predates the current week
    active_record = await Attendance.find_one(
        Attendance.user_id == current_user.id,
        Attendance.clock_out == None  # noqa: E711
    )
    if active_record and all(str(rec.id) != str(active_record.id) for rec in records):
        records = [active_record] + records
    
    # Calculate totals
    total_hours_today = sum(
        record.hours_worked or 0
        for record in records
        if record.date == today
    )
    
    total_hours_week = sum(
        record.hours_worked or 0
        for record in records
        if record.date >= week_start
    )
    
    return AttendanceSummary(
        total_hours_today=round(total_hours_today, 2),
        total_hours_week=round(total_hours_week, 2),
        records=[
            AttendanceResponse(
                id=str(record.id),
                user_id=str(record.user_id),
                clock_in=record.clock_in,
                clock_out=record.clock_out,
                hours_worked=record.hours_worked,
                date=record.date
            )
            for record in records
        ]
    )

@router.get("/logs", response_model=List[AttendanceLogEntry])
async def list_attendance_logs(
    limit: int = Query(10, ge=1, le=100),
    admin: User = Depends(require_admin),
):
    """List recent attendance logs for admins."""
    max_entries = min(limit, 10)  # Enforce a max of 10 entries for recent activity views
    records = await Attendance.find().sort("-clock_in").limit(max_entries).to_list()
    
    user_ids = list({record.user_id for record in records})
    users = await User.find({"_id": {"$in": user_ids}}).to_list()
    user_map: Dict = {user.id: user for user in users}
    
    entries: List[AttendanceLogEntry] = []
    for record in records:
        user = user_map.get(record.user_id)
        employee_name = user.name if user else "Unknown Employee"
        expected_clock_out = record.clock_out or (
            record.clock_in + timedelta(hours=DEFAULT_SHIFT_HOURS)
        )
        status = "active" if record.clock_out is None else "completed"
        
        entries.append(
            AttendanceLogEntry(
                id=str(record.id),
                employee_id=str(record.user_id),
                employee_name=employee_name,
                clock_in=record.clock_in,
                clock_out=record.clock_out,
                expected_clock_out=expected_clock_out,
                status=status,
            )
        )
    
    return entries


@router.post("/admin/{employee_id}/start", response_model=AttendanceResponse)
async def admin_clock_in_employee(
    employee_id: str,
    _admin: User = Depends(require_admin),
):
    """Allow admins to clock in an employee manually."""
    employee = await _get_employee_or_error(employee_id)

    existing = await Attendance.find_one(
        Attendance.user_id == employee.id,
        Attendance.clock_out == None
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee is already clocked in"
        )

    now = await get_current_time()
    attendance = Attendance(
        user_id=employee.id,
        clock_in=now,
        date=now.date()
    )
    await attendance.insert()
    await _mark_shift_attended(employee.id, now.date())
    return _build_attendance_response(attendance)


@router.post("/admin/{employee_id}/end", response_model=AttendanceResponse)
async def admin_clock_out_employee(
    employee_id: str,
    _admin: User = Depends(require_admin),
):
    """Allow admins to clock out an employee manually."""
    employee = await _get_employee_or_error(employee_id)

    attendance = await Attendance.find_one(
        Attendance.user_id == employee.id,
        Attendance.clock_out == None
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee is not currently clocked in"
        )

    now = await get_current_time()
    attendance.clock_out = now

    clock_in_time = _ensure_timezone_aware(attendance.clock_in, field_name="clock_in")
    time_diff = now - clock_in_time
    hours = time_diff.total_seconds() / 3600
    attendance.hours_worked = round(hours, 2)

    await attendance.save()
    await _mark_shift_attended(employee.id, now.date())
    return _build_attendance_response(attendance)
