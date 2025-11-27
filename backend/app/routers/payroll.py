from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import List
from datetime import date, timedelta

from app.models.user import User
from app.models.payroll import Payroll
from app.models.attendance import Attendance
from app.schemas.payroll import PayrollResponse, PayrollApprove
from app.utils.deps import require_admin, get_current_user

router = APIRouter()

@router.post("/run")
async def run_payroll(admin: User = Depends(require_admin)):
    """Manually trigger payroll generation (Admin only)."""
    from app.utils.scheduler import generate_payroll
    
    await generate_payroll()
    
    return {"message": "Payroll generation completed"}

@router.get("/pending", response_model=List[PayrollResponse])
async def get_pending_payrolls(admin: User = Depends(require_admin)):
    """Get all pending payroll records (Admin only)."""
    payrolls = await Payroll.find(Payroll.status == "pending").to_list()
    
    # Enrich with user names
    result = []
    for payroll in payrolls:
        user = await User.get(payroll.user_id)
        result.append(
            PayrollResponse(
                id=str(payroll.id),
                user_id=str(payroll.user_id),
                user_name=user.name if user else "Unknown",
                period_start=payroll.period_start,
                period_end=payroll.period_end,
                total_hours=payroll.total_hours,
                gross_pay=payroll.gross_pay,
                status=payroll.status,
                approved_by=str(payroll.approved_by) if payroll.approved_by else None,
                created_at=payroll.created_at
            )
        )
    
    return result

@router.put("/approve/{payroll_id}", response_model=PayrollResponse)
async def approve_payroll(payroll_id: str, admin: User = Depends(require_admin)):
    """Approve a payroll record (Admin only)."""
    try:
        payroll = await Payroll.get(ObjectId(payroll_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll record not found"
        )
    
    if not payroll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll record not found"
        )
    
    if payroll.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payroll already approved"
        )
    
    # Approve payroll
    payroll.status = "approved"
    payroll.approved_by = admin.id
    await payroll.save()
    
    # Get user name
    user = await User.get(payroll.user_id)
    
    return PayrollResponse(
        id=str(payroll.id),
        user_id=str(payroll.user_id),
        user_name=user.name if user else "Unknown",
        period_start=payroll.period_start,
        period_end=payroll.period_end,
        total_hours=payroll.total_hours,
        gross_pay=payroll.gross_pay,
        status=payroll.status,
        approved_by=str(payroll.approved_by) if payroll.approved_by else None,
        created_at=payroll.created_at
    )

@router.get("/my", response_model=List[PayrollResponse])
async def get_my_payrolls(current_user: User = Depends(get_current_user)):
    """Get approved payroll records for current employee."""
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can view their payroll"
        )
    
    # Only return approved payrolls
    payrolls = await Payroll.find(
        Payroll.user_id == current_user.id,
        Payroll.status == "approved"
    ).to_list()
    
    return [
        PayrollResponse(
            id=str(payroll.id),
            user_id=str(payroll.user_id),
            user_name=current_user.name,
            period_start=payroll.period_start,
            period_end=payroll.period_end,
            total_hours=payroll.total_hours,
            gross_pay=payroll.gross_pay,
            status=payroll.status,
            approved_by=str(payroll.approved_by) if payroll.approved_by else None,
            created_at=payroll.created_at
        )
        for payroll in payrolls
    ]
