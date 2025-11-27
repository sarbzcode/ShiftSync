from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.user import User
from app.schemas.settings import (
    CurrencyListResponse,
    CurrencyResponse,
    CurrencyUpdate,
    BudgetResponse,
    BudgetUpdate,
    TimezoneListResponse,
    TimezoneResponse,
    TimezoneUpdate,
)
from app.services.system_settings import (
    get_quarterly_budget,
    get_system_settings,
    list_currencies,
    list_timezones,
    update_quarterly_budget,
    update_system_currency,
    update_system_timezone,
)
from app.utils.deps import require_admin

router = APIRouter()


@router.get("/timezone", response_model=TimezoneResponse)
async def get_timezone_settings(admin: User = Depends(require_admin)):
    settings = await get_system_settings()
    updated_by = None
    updated_by_name = None

    if settings.updated_by:
        user = await User.get(settings.updated_by)
        if user:
            updated_by = str(user.id)
            updated_by_name = user.name

    return TimezoneResponse(
        timezone=settings.timezone,
        updated_at=settings.updated_at,
        updated_by=updated_by,
        updated_by_name=updated_by_name,
    )


@router.put("/timezone", response_model=TimezoneResponse)
async def update_timezone(payload: TimezoneUpdate, admin: User = Depends(require_admin)):
    try:
        settings = await update_system_timezone(payload.timezone, admin.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return TimezoneResponse(
        timezone=settings.timezone,
        updated_at=settings.updated_at,
        updated_by=str(admin.id),
        updated_by_name=admin.name,
    )


@router.get("/timezones", response_model=TimezoneListResponse)
async def list_supported_timezones(
    search: str | None = Query(default=None, description="Filter by partial match"),
    limit: int = Query(default=500, ge=1, le=1000),
    admin: User = Depends(require_admin),
):
    zones = list_timezones(search=search, limit=limit)
    return TimezoneListResponse(timezones=zones)


@router.get("/currency", response_model=CurrencyResponse)
async def get_currency_settings(admin: User = Depends(require_admin)):
    settings = await get_system_settings()
    updated_by = None
    updated_by_name = None

    if settings.currency_updated_by:
        user = await User.get(settings.currency_updated_by)
        if user:
            updated_by = str(user.id)
            updated_by_name = user.name

    return CurrencyResponse(
        currency=settings.currency,
        updated_at=settings.currency_updated_at,
        updated_by=updated_by,
        updated_by_name=updated_by_name,
    )


@router.put("/currency", response_model=CurrencyResponse)
async def update_currency(payload: CurrencyUpdate, admin: User = Depends(require_admin)):
    try:
        settings = await update_system_currency(payload.currency, admin.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return CurrencyResponse(
        currency=settings.currency,
        updated_at=settings.currency_updated_at,
        updated_by=str(admin.id),
        updated_by_name=admin.name,
    )


@router.get("/currencies", response_model=CurrencyListResponse)
async def list_supported_currencies(
    search: str | None = Query(default=None, description="Filter by code or name"),
    limit: int = Query(default=150, ge=1, le=500),
    admin: User = Depends(require_admin),
):
    currencies = list_currencies(search=search, limit=limit)
    return CurrencyListResponse(currencies=currencies)


@router.get("/budget", response_model=BudgetResponse)
async def get_budget_settings(admin: User = Depends(require_admin)):
    settings = await get_system_settings()

    updated_by = None
    updated_by_name = None
    if settings.quarterly_budget_updated_by:
        user = await User.get(settings.quarterly_budget_updated_by)
        if user:
            updated_by = str(user.id)
            updated_by_name = user.name

    return BudgetResponse(
        budget=settings.quarterly_budget,
        updated_at=settings.quarterly_budget_updated_at,
        updated_by=updated_by,
        updated_by_name=updated_by_name,
    )


@router.put("/budget", response_model=BudgetResponse)
async def update_budget(payload: BudgetUpdate, admin: User = Depends(require_admin)):
    try:
        settings = await update_quarterly_budget(payload.budget, admin.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return BudgetResponse(
        budget=settings.quarterly_budget,
        updated_at=settings.quarterly_budget_updated_at,
        updated_by=str(admin.id),
        updated_by_name=admin.name,
    )
