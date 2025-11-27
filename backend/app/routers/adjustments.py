from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.models.adjustment import AdjustmentType, EmployeeAdjustment
from app.models.user import User
from app.schemas.adjustment import (
    AdjustmentTypeCreate,
    AdjustmentTypeResponse,
    AdjustmentTypeUpdate,
    EmployeeAdjustmentCreate,
    EmployeeAdjustmentResponse,
    EmployeeAdjustmentUpdate,
)
from app.utils.deps import require_admin

router = APIRouter()


def _serialize_type(ad: AdjustmentType) -> AdjustmentTypeResponse:
    return AdjustmentTypeResponse(
        id=str(ad.id),
        name=ad.name,
        direction=ad.direction,
        mode=ad.mode,
        rate_or_amount=ad.rate_or_amount,
        cap_per_period=ad.cap_per_period,
        apply_on=ad.apply_on,
        overtime_rule=ad.overtime_rule,
        applies_globally=ad.applies_globally,
        note=ad.note,
        effective_start=ad.effective_start,
        effective_end=ad.effective_end,
        created_at=ad.created_at,
        updated_at=ad.updated_at,
    )


def _serialize_assignment(adj: EmployeeAdjustment) -> EmployeeAdjustmentResponse:
    return EmployeeAdjustmentResponse(
        id=str(adj.id),
        adjustment_type_id=str(adj.adjustment_type_id),
        employee_id=str(adj.employee_id),
        override_rate_or_amount=adj.override_rate_or_amount,
        override_cap=adj.override_cap,
        replace_global=adj.replace_global,
        status=adj.status,
        note=adj.note,
        effective_start=adj.effective_start,
        effective_end=adj.effective_end,
        created_at=adj.created_at,
        updated_at=adj.updated_at,
    )


@router.post("/types", response_model=AdjustmentTypeResponse)
async def create_adjustment_type(payload: AdjustmentTypeCreate, admin: User = Depends(require_admin)):
    adjustment = AdjustmentType(**payload.dict())
    await adjustment.insert()
    return _serialize_type(adjustment)


@router.get("/types", response_model=List[AdjustmentTypeResponse])
async def list_adjustment_types(admin: User = Depends(require_admin)):
    adjustments = await AdjustmentType.find().sort("-created_at").to_list()
    return [_serialize_type(ad) for ad in adjustments]


@router.patch("/types/{adjustment_id}", response_model=AdjustmentTypeResponse)
async def update_adjustment_type(
    adjustment_id: str, payload: AdjustmentTypeUpdate, admin: User = Depends(require_admin)
):
    adjustment = await AdjustmentType.get(ObjectId(adjustment_id))
    if not adjustment:
        raise HTTPException(status_code=404, detail="Adjustment type not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(adjustment, field, value)
    adjustment.updated_at = datetime.utcnow()
    await adjustment.save()
    return _serialize_type(adjustment)


@router.post("/employees/{employee_id}/adjustments", response_model=EmployeeAdjustmentResponse)
async def assign_adjustment_to_employee(
    employee_id: str, payload: EmployeeAdjustmentCreate, admin: User = Depends(require_admin)
):
    assignment = EmployeeAdjustment(
        employee_id=ObjectId(employee_id),
        adjustment_type_id=ObjectId(payload.adjustment_type_id),
        override_rate_or_amount=payload.override_rate_or_amount,
        override_cap=payload.override_cap,
        replace_global=payload.replace_global,
        status=payload.status,
        note=payload.note,
        effective_start=payload.effective_start,
        effective_end=payload.effective_end,
    )
    await assignment.insert()
    return _serialize_assignment(assignment)


@router.get("/employees/{employee_id}/adjustments", response_model=List[EmployeeAdjustmentResponse])
async def list_employee_adjustments(employee_id: str, admin: User = Depends(require_admin)):
    assignments = await EmployeeAdjustment.find(EmployeeAdjustment.employee_id == ObjectId(employee_id)).sort(
        "-created_at"
    ).to_list()
    return [_serialize_assignment(adj) for adj in assignments]


@router.patch(
    "/employees/{employee_id}/adjustments/{assignment_id}", response_model=EmployeeAdjustmentResponse
)
async def update_employee_adjustment(
    employee_id: str, assignment_id: str, payload: EmployeeAdjustmentUpdate, admin: User = Depends(require_admin)
):
    assignment = await EmployeeAdjustment.get(ObjectId(assignment_id))
    if not assignment or str(assignment.employee_id) != employee_id:
        raise HTTPException(status_code=404, detail="Employee adjustment not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(assignment, field, value)
    assignment.updated_at = datetime.utcnow()
    await assignment.save()
    return _serialize_assignment(assignment)
