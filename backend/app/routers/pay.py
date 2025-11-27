from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Dict, List, Set, Tuple

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.models.pay import Pay
from app.models.pay_approve import PayApprove
from app.models.adjustment import AdjustmentType, EmployeeAdjustment
from app.models.shift import Shift
from app.models.user import User
from app.schemas.pay import (
    PayApproveResponse,
    PayGenerateResponse,
    PayRecordResponse,
    PaySyncApproveResponse,
)
from app.services.system_settings import get_current_date
from app.utils.deps import require_admin, get_current_user

router = APIRouter()


def _week_range(reference: date) -> Tuple[date, date]:
    days_since_friday = (reference.weekday() - 4) % 7
    week_end = reference - timedelta(days=days_since_friday)
    week_start = week_end - timedelta(days=6)
    return week_start, week_end


def _parse_shift_hours(shift: Shift) -> float:
    start_dt = datetime.strptime(f'{shift.shift_date} {shift.start_time}', '%Y-%m-%d %H:%M')
    end_dt = datetime.strptime(f'{shift.shift_date} {shift.end_time}', '%Y-%m-%d %H:%M')
    if end_dt < start_dt:
        return 0.0
    hours = (end_dt - start_dt).total_seconds() / 3600
    return max(hours, 0.0)


async def _calculate_hours_by_employee(week_start: date, week_end: date) -> Dict[ObjectId, float]:
    hours: Dict[ObjectId, float] = defaultdict(float)
    shifts = await Shift.find(
        Shift.shift_date >= week_start,
        Shift.shift_date <= week_end,
        Shift.status == 'completed',
    ).to_list()
    for shift in shifts:
        hours[shift.employee_id] += _parse_shift_hours(shift)
    return hours


def _calculate_amount(hours: float, pay_rate: float) -> float:
    base_hours = min(hours, 40.0)
    overtime_hours = max(hours - 40.0, 0.0)
    base_pay = base_hours * pay_rate
    overtime_pay = overtime_hours * pay_rate * 1.5
    amount = base_pay + overtime_pay
    return round(amount, 2), round(base_pay, 2), round(overtime_pay, 2)


def _effective_today(start: date | None, end: date | None, today: date) -> bool:
    if start and today < start:
        return False
    if end and today > end:
        return False
    return True


async def _compute_adjustments(user_id: ObjectId, gross: float, overtime_pay: float, today: date) -> tuple[list[dict], float]:
    adjustments: list[dict] = []
    net_delta = 0.0

    types = await AdjustmentType.find().to_list()
    active_global = {t.id: t for t in types if t.applies_globally and _effective_today(t.effective_start, t.effective_end, today)}

    assignments = await EmployeeAdjustment.find(
        EmployeeAdjustment.employee_id == user_id,
        EmployeeAdjustment.status == "active",
    ).to_list()

    # Remove globals if replaced
    replaced_ids = {a.adjustment_type_id for a in assignments if a.replace_global}
    for rid in replaced_ids:
        active_global.pop(rid, None)

    applicable: list[tuple[AdjustmentType, EmployeeAdjustment | None]] = []
    for t in active_global.values():
        applicable.append((t, None))
    for a in assignments:
        t = next((x for x in types if x.id == a.adjustment_type_id), None)
        if not t:
            continue
        if not _effective_today(a.effective_start, a.effective_end, today):
            continue
        applicable.append((t, a))

    for t, a in applicable:
        rate = a.override_rate_or_amount if a and a.override_rate_or_amount is not None else t.rate_or_amount
        cap = a.override_cap if a and a.override_cap is not None else t.cap_per_period
        base_amount = overtime_pay if t.apply_on == "overtime_only" else gross
        value = rate if t.mode == "flat" else (base_amount * (rate / 100.0))
        value = round(value, 2)
        cap_hit = False
        if cap is not None and value > cap:
            value = round(cap, 2)
            cap_hit = True
        sign = 1 if t.direction == "add" else -1
        net_delta += sign * value
        adjustments.append(
            {
                "name": t.name,
                "direction": t.direction,
                "mode": t.mode,
                "rate_or_amount": rate,
                "apply_on": t.apply_on,
                "overtime_rule": t.overtime_rule,
                "cap_per_period": cap,
                "amount_applied": value,
                "cap_hit": cap_hit,
            }
        )

    return adjustments, round(net_delta, 2)


def _week_key(reference: date) -> Tuple[date, date]:
    return _week_range(reference)


async def _sync_pay_records(week_start: date, week_end: date) -> int:
    hours_by_employee = await _calculate_hours_by_employee(week_start, week_end)
    existing_approved = await Pay.find(
        Pay.week_start == week_start,
        Pay.week_end == week_end,
        Pay.status == 'approved',
    ).to_list()
    approved_by_user = {record.user_id for record in existing_approved}

    existing_records = await PayApprove.find(
        PayApprove.week_start == week_start,
        PayApprove.week_end == week_end,
    ).to_list()
    existing_by_user = {record.user_id: record for record in existing_records}
    employee_ids = list(hours_by_employee.keys())
    generated = 0

    if not employee_ids:
        # Clean up orphaned pending records if nobody worked.
        for record in existing_records:
            if record.status == 'pending':
                await record.delete()
        return generated

    employees = await User.find({'_id': {'$in': employee_ids}}).to_list()
    employee_map = {employee.id: employee for employee in employees}

    for employee_id, hours in hours_by_employee.items():
        if hours <= 0:
            continue
        if employee_id in approved_by_user:
            # Already approved for this week, skip duplicate generation
            continue
        employee = employee_map.get(employee_id)
        if not employee:
            continue
        gross_amount, base_pay, overtime_pay = _calculate_amount(hours, employee.pay_rate)
        adjustments, delta = await _compute_adjustments(employee_id, gross_amount, overtime_pay, week_end)
        amount = round(gross_amount + delta, 2)
        record = existing_by_user.get(employee_id)
        if record:
            if record.status in ['pending', 'held']:
                updated = False
                rounded_hours = round(hours, 2)
                if abs(record.hours_worked - rounded_hours) > 0.001:
                    record.hours_worked = rounded_hours
                    updated = True
                if abs(record.amount - amount) > 0.01:
                    record.amount = amount
                    updated = True
                if getattr(record, "gross_amount", None) is None or abs(record.gross_amount - gross_amount) > 0.01:
                    record.gross_amount = gross_amount
                    updated = True
                record.adjustments = adjustments
                if updated:
                    await record.save()
        else:
            record = PayApprove(
                user_id=employee_id,
                week_start=week_start,
                week_end=week_end,
                hours_worked=round(hours, 2),
                gross_amount=gross_amount,
                amount=amount,
                adjustments=adjustments,
            )
            await record.insert()
            generated += 1

    for record in existing_records:
        if record.user_id not in hours_by_employee and record.status == 'pending':
            await record.delete()

    return generated


async def _sync_missing_from_completed_shifts() -> Tuple[Set[Tuple[date, date]], int]:
    shifts = await Shift.find(Shift.status == 'completed').to_list()
    if not shifts:
        return set(), 0

    week_ranges: Set[Tuple[date, date]] = set()
    for shift in shifts:
        week_ranges.add(_week_key(shift.shift_date))

    generated = 0
    for week_start, week_end in week_ranges:
        generated += await _sync_pay_records(week_start, week_end)

    return week_ranges, generated


async def _latest_completed_shift_date() -> date | None:
    latest = await Shift.find(Shift.status == 'completed').sort('-shift_date').limit(1).to_list()
    return latest[0].shift_date if latest else None


async def _latest_pay_week_end() -> date | None:
    latest = await Pay.find().sort('-week_end').limit(1).to_list()
    return latest[0].week_end if latest else None


@router.post('/generate', response_model=PayGenerateResponse)
async def generate_pay_records(admin: User = Depends(require_admin)):
    latest_shift_date = await _latest_completed_shift_date()
    if not latest_shift_date:
        return PayGenerateResponse(generated=0, weeks_processed=0)

    latest_pay_week_end = await _latest_pay_week_end()
    if latest_pay_week_end:
        delta_days = (latest_shift_date - latest_pay_week_end).days
        if delta_days <= 7:
            # Shifts already covered within the last payroll week; skip generation
            return PayGenerateResponse(generated=0, weeks_processed=0)

    week_ranges, generated = await _sync_missing_from_completed_shifts()
    return PayGenerateResponse(generated=generated, weeks_processed=len(week_ranges))


@router.get('/my', response_model=List[PayRecordResponse])
async def get_my_pay_records(current_user: User = Depends(get_current_user)):
    records = await Pay.find(
        Pay.user_id == current_user.id,
        Pay.status == 'approved'
    ).sort("-week_end").to_list()
    
    return [
        PayRecordResponse(
            id=str(record.id),
            user_id=str(record.user_id),
            employee_name=current_user.name,
            week_start=record.week_start,
            week_end=record.week_end,
            hours_worked=record.hours_worked,
            gross_amount=getattr(record, "gross_amount", record.amount),
            amount=record.amount,
            adjustments=getattr(record, "adjustments", []),
            status=record.status,
            created_at=record.created_at,
        )
        for record in records
    ]


@router.get('/my/{pay_id}', response_model=PayRecordResponse)
async def get_my_pay_record(pay_id: str, current_user: User = Depends(get_current_user)):
    try:
        record = await Pay.get(ObjectId(pay_id))
    except Exception:
        record = None

    if not record or record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail='Pay record not found')

    return PayRecordResponse(
        id=str(record.id),
        user_id=str(record.user_id),
        employee_name=current_user.name,
        week_start=record.week_start,
        week_end=record.week_end,
        hours_worked=record.hours_worked,
        gross_amount=getattr(record, "gross_amount", record.amount),
        amount=record.amount,
        adjustments=getattr(record, "adjustments", []),
        status=record.status,
        created_at=record.created_at,
    )


@router.get('/pending', response_model=List[PayRecordResponse])
async def list_pending_pay_records(admin: User = Depends(require_admin)):
    pending_records = await PayApprove.find(
        {"status": {"$in": ["pending", "held"]}},
    ).sort("+status", "-week_end", "+created_at").to_list()

    if not pending_records:
        return []

    user_ids = [record.user_id for record in pending_records]
    users = await User.find({'_id': {'$in': user_ids}}).to_list()
    user_map = {user.id: user for user in users}

    return [
        PayRecordResponse(
            id=str(record.id),
            user_id=str(record.user_id),
            employee_name=user_map.get(record.user_id).name if user_map.get(record.user_id) else 'Unknown',
            week_start=record.week_start,
            week_end=record.week_end,
            hours_worked=record.hours_worked,
            gross_amount=getattr(record, "gross_amount", record.amount),
            amount=record.amount,
            adjustments=getattr(record, "adjustments", []),
            status=record.status,
            created_at=record.created_at,
        )
        for record in pending_records
    ]


@router.get('/approved', response_model=List[PayRecordResponse])
async def list_approved_pay_records(admin: User = Depends(require_admin)):
    approved_records = await Pay.find(Pay.status == 'approved').sort("-week_end", "-created_at").to_list()

    if not approved_records:
        return []

    user_ids = [record.user_id for record in approved_records]
    users = await User.find({'_id': {'$in': user_ids}}).to_list()
    user_map = {user.id: user for user in users}

    return [
        PayRecordResponse(
            id=str(record.id),
            user_id=str(record.user_id),
            employee_name=user_map.get(record.user_id).name if user_map.get(record.user_id) else 'Unknown',
            week_start=record.week_start,
            week_end=record.week_end,
            hours_worked=record.hours_worked,
            gross_amount=getattr(record, "gross_amount", record.amount),
            amount=record.amount,
            adjustments=getattr(record, "adjustments", []),
            status=record.status,
            created_at=record.created_at,
        )
        for record in approved_records
    ]


@router.post('/approve-missing', response_model=PaySyncApproveResponse)
async def approve_missing_pay_records(admin: User = Depends(require_admin)):
    """
    Sync pay records for all completed shifts (across all weeks).
    Newly created records remain pending; held records are untouched.
    """
    week_ranges, _ = await _sync_missing_from_completed_shifts()
    if not week_ranges:
        return PaySyncApproveResponse(synced_weeks=0, approved=0)

    week_starts = [ws for ws, _ in week_ranges]
    week_ends = [we for _, we in week_ranges]

    pending_records = await PayApprove.find(
        {"status": "pending", "week_start": {"$in": week_starts}, "week_end": {"$in": week_ends}}
    ).count()

    return PaySyncApproveResponse(synced_weeks=len(week_ranges), approved=0)


@router.post('/approve-all', response_model=PayApproveResponse)
async def approve_all_pay_records(admin: User = Depends(require_admin)):
    # Approve every pending record (all weeks). Held records are skipped.
    pending = await PayApprove.find({"status": "pending"}).to_list()

    if not pending:
        raise HTTPException(status_code=400, detail='No pending pay records to approve')

    for record in pending:
        approved = Pay(
            user_id=record.user_id,
            week_start=record.week_start,
            week_end=record.week_end,
            hours_worked=record.hours_worked,
            gross_amount=getattr(record, "gross_amount", record.amount),
            amount=record.amount,
            adjustments=getattr(record, "adjustments", []),
            status='approved',
            approved_by=admin.id,
        )
        await approved.insert()
        await record.delete()

    # Return a simple response referencing current pay period
    week_start, week_end = _week_range(await get_current_date())
    return PayApproveResponse(
        id='bulk',
        status='approved',
        approved_by=str(admin.id),
        week_start=week_start,
        week_end=week_end,
    )


@router.put('/{pay_id}/hold', response_model=PayApproveResponse)
async def hold_pay_record(pay_id: str, admin: User = Depends(require_admin)):
    try:
        pay_record = await PayApprove.get(ObjectId(pay_id))
    except Exception:
        pay_record = None

    if not pay_record:
        raise HTTPException(status_code=404, detail='Pay record not found')

    if pay_record.status == 'approved':
        raise HTTPException(status_code=400, detail='Approved records cannot be held')

    pay_record.status = 'pending' if pay_record.status == 'held' else 'held'
    await pay_record.save()

    return PayApproveResponse(
        id=str(pay_record.id),
        status=pay_record.status,
        approved_by=str(admin.id) if pay_record.status == 'approved' else None,
        week_start=pay_record.week_start,
        week_end=pay_record.week_end,
    )


@router.put('/{pay_id}/approve', response_model=PayApproveResponse)
async def approve_pay_record(pay_id: str, admin: User = Depends(require_admin)):
    try:
        pay_record = await PayApprove.get(ObjectId(pay_id))
    except Exception:
        pay_record = None

    if not pay_record:
        raise HTTPException(status_code=404, detail='Pay record not found')
    if pay_record.status == 'approved':
        raise HTTPException(status_code=400, detail='Pay record already approved')

    approved = Pay(
        user_id=pay_record.user_id,
        week_start=pay_record.week_start,
        week_end=pay_record.week_end,
        hours_worked=pay_record.hours_worked,
        gross_amount=getattr(pay_record, "gross_amount", pay_record.amount),
        amount=pay_record.amount,
        adjustments=getattr(pay_record, "adjustments", []),
        status='approved',
        approved_by=admin.id,
    )
    await approved.insert()
    await pay_record.delete()

    return PayApproveResponse(
        id=str(pay_record.id),
        status=pay_record.status,
        approved_by=str(admin.id),
        week_start=pay_record.week_start,
        week_end=pay_record.week_end,
    )
