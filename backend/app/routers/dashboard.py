from collections import defaultdict
from calendar import monthrange
from fastapi import APIRouter, Depends
from datetime import datetime, date, timedelta
from typing import Dict, Any, List

from app.config import settings
from app.models.user import User
from app.models.shift import Shift
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.models.pay import Pay
from app.models.pay_approve import PayApprove
from app.utils.deps import require_admin
from app.services.system_settings import get_current_date

router = APIRouter()

def _shift_hours(start_time: str, end_time: str) -> float:
    try:
        start_dt = datetime.strptime(start_time, "%H:%M")
        end_dt = datetime.strptime(end_time, "%H:%M")
    except ValueError:
        return 0.0
    hours = (end_dt - start_dt).total_seconds() / 3600
    if hours <= 0:
        hours += 24
    return round(hours, 2)

def _attendance_hours(record: Attendance) -> float:
    if record.hours_worked is not None:
        return float(record.hours_worked)
    if record.clock_out:
        return round((record.clock_out - record.clock_in).total_seconds() / 3600, 2)
    return 0.0

def _week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())

def _next_weekday(start: date, weekday: int) -> date:
    days_forward = (weekday - start.weekday() + 7) % 7
    return start + timedelta(days=days_forward or 7)

@router.get("/stats")
async def get_dashboard_stats(admin: User = Depends(require_admin)):
    total_employees = await User.find(User.role == "employee").count()
    active_shifts = await Attendance.find(Attendance.clock_out == None).count()
    pending_payrolls = await Payroll.find(Payroll.status == "pending").count()
    clocked_in = await Attendance.find(Attendance.clock_out == None).count()
    
    return {
        "total_employees": total_employees,
        "active_shifts": active_shifts,
        "pending_payrolls": pending_payrolls,
        "currently_clocked_in": clocked_in
    }

@router.get("/analytics")
async def get_dashboard_analytics(admin: User = Depends(require_admin)):
    today = await get_current_date()
    start_60 = today - timedelta(days=60)
    start_30 = today - timedelta(days=30)
    start_7 = today - timedelta(days=6)
    month_start = date(today.year, today.month, 1)
    # Track current month span for attendance overview
    start_month_span = month_start
    prev_month_end = month_start - timedelta(days=1)
    prev_month_start = date(prev_month_end.year, prev_month_end.month, 1)
    month_end = date(today.year, today.month, monthrange(today.year, today.month)[1])
    future_end = today + timedelta(days=21)
    
    employees = await User.find(User.role == "employee").to_list()
    employee_map = {employee.id: employee for employee in employees}
    avg_pay_rate = (
        sum(employee.pay_rate for employee in employees) / len(employees)
        if employees else 0.0
    )
    
    attendance_records = await Attendance.find(
        Attendance.date >= start_60
    ).to_list()
    shifts = await Shift.find(
        Shift.shift_date >= start_60,
        Shift.shift_date <= future_end
    ).to_list()
    payroll_records = await Payroll.find(
        Payroll.period_end >= start_60
    ).to_list()
    pay_records = await Pay.find(Pay.week_end >= start_60).to_list()
    pay_pending_records = await PayApprove.find().to_list()
    
    daily_worked_hours: Dict[date, float] = defaultdict(float)
    attendance_counts: Dict[date, int] = defaultdict(int)
    missed_clock_ins = 0
    for record in attendance_records:
        worked = _attendance_hours(record)
        daily_worked_hours[record.date] += worked
        attendance_counts[record.date] += 1
        if record.clock_out is None and record.date < today:
            missed_clock_ins += 1
    
    hours_trend = [
        {"date": day.isoformat(), "hours": round(daily_worked_hours[day], 2)}
        for day in sorted(daily_worked_hours)
        if day >= start_30
    ]
    
    daily_scheduled_hours: Dict[date, float] = defaultdict(float)
    daily_shift_costs: Dict[date, float] = defaultdict(float)
    weekly_shift_costs: Dict[date, float] = defaultdict(float)
    open_shifts_by_day: Dict[date, int] = defaultdict(int)
    shift_followups = 0
    for shift in shifts:
        hours = _shift_hours(shift.start_time, shift.end_time)
        daily_scheduled_hours[shift.shift_date] += hours
        employee = employee_map.get(shift.employee_id)
        pay_rate = employee.pay_rate if employee else 0.0
        cost = round(hours * pay_rate, 2)
        daily_shift_costs[shift.shift_date] += cost
        weekly_shift_costs[_week_start(shift.shift_date)] += cost
        if shift.status != "completed":
            open_shifts_by_day[shift.shift_date] += 1
        if shift.status == "assigned" and shift.shift_date < today:
            shift_followups += 1
    
    payments_status_amounts: Dict[str, float] = defaultdict(float)
    weekly_payroll_costs: Dict[date, float] = defaultdict(float)
    dept_payroll_totals: Dict[str, float] = defaultdict(float)
    overtime_pending = 0
    payroll_processed = 0.0

    # Legacy payroll records
    for payroll in payroll_records:
        payments_status_amounts[payroll.status] += float(payroll.gross_pay)
        weekly_payroll_costs[_week_start(payroll.period_end)] += float(payroll.gross_pay)
        employee = employee_map.get(payroll.user_id)
        dept = employee.department if employee and employee.department else "Unassigned"
        if payroll.period_end >= month_start:
            dept_payroll_totals[dept] += float(payroll.gross_pay)
        if payroll.status == "pending":
            overtime_pending += 1
        if payroll.status == "approved" and payroll.created_at.date() >= month_start:
            payroll_processed += float(payroll.gross_pay)

    # New pay records (approved)
    for pay in pay_records:
        payments_status_amounts[pay.status] += float(pay.amount)
        weekly_payroll_costs[_week_start(pay.week_end)] += float(pay.amount)
        employee = employee_map.get(pay.user_id)
        dept = employee.department if employee and employee.department else "Unassigned"
        if pay.week_end >= month_start:
            dept_payroll_totals[dept] += float(pay.amount)
        if pay.status == "approved" and pay.created_at.date() >= month_start:
            payroll_processed += float(pay.amount)

    # Pending/held pay approvals
    for pending in pay_pending_records:
        payments_status_amounts["pending"] += float(pending.amount)
        if pending.status in ["pending", "held"]:
            overtime_pending += 1
    
    current_labor_cost = sum(
        cost for shift_date, cost in daily_shift_costs.items()
        if shift_date >= month_start
    )
    previous_labor_cost = sum(
        cost for shift_date, cost in daily_shift_costs.items()
        if prev_month_start <= shift_date <= prev_month_end
    )
    trend = 0.0
    if previous_labor_cost > 0:
        trend = round(
            ((current_labor_cost - previous_labor_cost) / previous_labor_cost) * 100,
            1
        )
    
    daily_overtime_hours: Dict[date, float] = defaultdict(float)
    overtime_spend = 0.0
    for day in daily_worked_hours.keys() | daily_scheduled_hours.keys():
        scheduled = daily_scheduled_hours.get(day, 0.0)
        worked = daily_worked_hours.get(day, 0.0)
        overtime = max(0.0, worked - scheduled)
        daily_overtime_hours[day] = overtime
        if overtime > 0:
            avg_rate = (
                daily_shift_costs.get(day, 0.0) / scheduled
                if scheduled > 0 else avg_pay_rate
            )
            overtime_spend += overtime * max(avg_rate, 0.0) * 1.5
    
    financial_snapshot = {
        "labor_cost": round(current_labor_cost, 2),
        "payroll_processed": round(payroll_processed, 2),
        "overtime_spend": round(overtime_spend, 2),
        "trend": trend
    }
    
    budget = settings.MONTHLY_LABOR_BUDGET or current_labor_cost
    budget_progress = {
        "used": round(current_labor_cost, 2),
        "budget": round(budget, 2),
        "remaining": round(max(budget - current_labor_cost, 0.0), 2),
        "percent": round((current_labor_cost / budget) * 100, 1) if budget else 0.0
    }
    
    week_ranges = []
    base_week = _week_start(today) - timedelta(weeks=5)
    for i in range(6):
        week_start = base_week + timedelta(weeks=i)
        label = week_start.strftime("Week of %b %d")
        week_ranges.append({
            "label": label,
            "scheduled_cost": round(weekly_shift_costs.get(week_start, 0.0), 2),
            "payroll_cost": round(weekly_payroll_costs.get(week_start, 0.0), 2)
        })
    
    productivity_trend = []
    trend_start = today - timedelta(days=13)
    for i in range(14):
        day = trend_start + timedelta(days=i)
        scheduled = daily_scheduled_hours.get(day, 0.0)
        worked = daily_worked_hours.get(day, 0.0)
        overtime = daily_overtime_hours.get(day, 0.0)
        productivity_trend.append({
            "date": day.isoformat(),
            "scheduled_hours": round(scheduled, 2),
            "worked_hours": round(worked, 2),
            "overtime_hours": round(overtime, 2)
        })
    
    attendance_overview = []
    span_days = (today - start_month_span).days + 1
    for i in range(span_days):
        day = start_month_span + timedelta(days=i)
        attendance_overview.append({
            "date": day.isoformat(),
            "count": attendance_counts.get(day, 0)
        })
    
    coverage_heatmap = []
    for i in range(14):
        day = today + timedelta(days=i)
        coverage_heatmap.append({
            "date": day.isoformat(),
            "open_shifts": open_shifts_by_day.get(day, 0),
            "overtime_hours": round(daily_overtime_hours.get(day, 0.0), 2)
        })
    
    last_week_days = [today - timedelta(days=i) for i in range(1, 8)]
    prev_week_days = [today - timedelta(days=i) for i in range(8, 15)]
    scheduled_last = sum(daily_scheduled_hours.get(day, 0.0) for day in last_week_days)
    worked_last = sum(daily_worked_hours.get(day, 0.0) for day in last_week_days)
    scheduled_prev = sum(daily_scheduled_hours.get(day, 0.0) for day in prev_week_days)
    worked_prev = sum(daily_worked_hours.get(day, 0.0) for day in prev_week_days)
    utilization_pct = (worked_last / scheduled_last * 100) if scheduled_last else 0.0
    prev_pct = (worked_prev / scheduled_prev * 100) if scheduled_prev else 0.0
    utilization = {
        "percentage": round(utilization_pct, 1),
        "trend": round(utilization_pct - prev_pct, 1)
    }
    
    payments_status = []
    for status in ["pending", "approved", "held", "rejected"]:
        payments_status.append({
            "status": status.title(),
            "amount": round(payments_status_amounts.get(status, 0.0), 2)
        })
    
    exceptions = {
        "missed_clock_ins": missed_clock_ins,
        "overtime_pending": overtime_pending,
        "shift_followups": shift_followups
    }
    
    top_drivers = []
    total_driver_amount = sum(dept_payroll_totals.values())
    for dept, amount in sorted(dept_payroll_totals.items(), key=lambda x: x[1], reverse=True)[:4]:
        percent = (amount / total_driver_amount * 100) if total_driver_amount else 0.0
        top_drivers.append({
            "department": dept,
            "amount": round(amount, 2),
            "percent": round(percent, 1)
        })
    
    next_payroll_day = _next_weekday(today, 4)
    busiest_future_day = max(
        (cell for cell in coverage_heatmap if date.fromisoformat(cell["date"]) > today),
        key=lambda cell: (cell["open_shifts"], cell["overtime_hours"]),
        default=None
    )
    busiest_date = today + timedelta(days=1)
    busiest_description = "Coverage looks balanced"
    if busiest_future_day:
        busiest_date = date.fromisoformat(busiest_future_day["date"])
        busiest_description = f"{busiest_future_day['open_shifts']} open shifts awaiting assignment"
    
    milestones = [
        {
            "title": "Next Payroll Run",
            "date": next_payroll_day.isoformat(),
            "description": f"Approve payroll by {next_payroll_day.strftime('%b %d')}."
        },
        {
            "title": "Busiest Coverage Day",
            "date": busiest_date.isoformat(),
            "description": busiest_description
        },
        {
            "title": "Month-End Close",
            "date": month_end.isoformat(),
            "description": "Finalize attendance and payroll checks."
        }
    ]
    
    dept_count: Dict[str, int] = defaultdict(int)
    for employee in employees:
        dept = employee.department or "Unassigned"
        dept_count[dept] += 1
    employees_by_department = [
        {"department": dept, "count": count}
        for dept, count in dept_count.items()
    ]
    
    return {
        "hours_trend": hours_trend,
        "employees_by_department": employees_by_department,
        "attendance_overview": attendance_overview,
        "financial_snapshot": financial_snapshot,
        "labor_vs_payroll": week_ranges,
        "budget_progress": budget_progress,
        "productivity_trend": productivity_trend,
        "coverage_heatmap": coverage_heatmap,
        "utilization": utilization,
        "payments_status": payments_status,
        "exceptions": exceptions,
        "top_drivers": top_drivers,
        "milestones": milestones
    }

@router.get("/recent-activity")
async def get_recent_activity(admin: User = Depends(require_admin)):
    activities: List[Dict[str, Any]] = []
    recent_attendance = await Attendance.find().sort("-clock_in").limit(10).to_list()
    user_cache: Dict[Any, User] = {}
    
    for record in recent_attendance:
        if record.user_id not in user_cache:
            user_cache[record.user_id] = await User.get(record.user_id)
        user = user_cache.get(record.user_id)
        if not user:
            continue
        if record.clock_out:
            timestamp = record.clock_out.isoformat()
            activity_type = "clock_out"
            message = f"{user.name} clocked out"
        else:
            timestamp = record.clock_in.isoformat()
            activity_type = "clock_in"
            message = f"{user.name} clocked in"
        activities.append({
            "type": activity_type,
            "message": message,
            "timestamp": timestamp,
            "user_name": user.name
        })
    
    recent_payrolls = await Payroll.find(
        Payroll.status == "approved"
    ).sort("-created_at").limit(5).to_list()
    
    for payroll in recent_payrolls:
        if payroll.user_id not in user_cache:
            user_cache[payroll.user_id] = await User.get(payroll.user_id)
        user = user_cache.get(payroll.user_id)
        if not user:
            continue
        activities.append({
            "type": "payroll_approved",
            "message": f"Payroll approved for {user.name}",
            "timestamp": payroll.created_at.isoformat(),
            "user_name": user.name
        })
    
    activities.sort(key=lambda entry: entry["timestamp"], reverse=True)
    return {"activities": activities[:15]}
