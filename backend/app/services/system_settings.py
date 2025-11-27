from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, available_timezones

from bson import ObjectId

from app.models.system_settings import SystemSettings

_settings_cache: Optional[SystemSettings] = None

SUPPORTED_CURRENCIES = [
    {"code": "USD", "name": "United States Dollar"},
    {"code": "EUR", "name": "Euro"},
    {"code": "GBP", "name": "British Pound Sterling"},
    {"code": "JPY", "name": "Japanese Yen"},
    {"code": "CAD", "name": "Canadian Dollar"},
    {"code": "AUD", "name": "Australian Dollar"},
    {"code": "CHF", "name": "Swiss Franc"},
    {"code": "CNY", "name": "Chinese Yuan"},
    {"code": "INR", "name": "Indian Rupee"},
    {"code": "BRL", "name": "Brazilian Real"},
    {"code": "MXN", "name": "Mexican Peso"},
    {"code": "ZAR", "name": "South African Rand"},
    {"code": "KES", "name": "Kenyan Shilling"},
    {"code": "NGN", "name": "Nigerian Naira"},
    {"code": "GHS", "name": "Ghanaian Cedi"},
    {"code": "SGD", "name": "Singapore Dollar"},
    {"code": "HKD", "name": "Hong Kong Dollar"},
    {"code": "KRW", "name": "South Korean Won"},
    {"code": "SEK", "name": "Swedish Krona"},
    {"code": "NOK", "name": "Norwegian Krone"},
    {"code": "DKK", "name": "Danish Krone"},
    {"code": "NZD", "name": "New Zealand Dollar"},
    {"code": "AED", "name": "United Arab Emirates Dirham"},
    {"code": "SAR", "name": "Saudi Riyal"},
    {"code": "TRY", "name": "Turkish Lira"},
    {"code": "PKR", "name": "Pakistani Rupee"},
    {"code": "BDT", "name": "Bangladeshi Taka"},
    {"code": "PLN", "name": "Polish Zloty"},
    {"code": "CZK", "name": "Czech Koruna"},
    {"code": "HUF", "name": "Hungarian Forint"},
    {"code": "ILS", "name": "Israeli New Shekel"},
    {"code": "EGP", "name": "Egyptian Pound"},
]

SUPPORTED_CURRENCY_CODES = {currency["code"] for currency in SUPPORTED_CURRENCIES}


async def _ensure_settings() -> SystemSettings:
    global _settings_cache
    if _settings_cache:
        return _settings_cache

    settings = await SystemSettings.find_one({})
    if not settings:
        settings = SystemSettings()
        await settings.insert()

    needs_save = False

    if not getattr(settings, "currency", None):
        settings.currency = "USD"
        needs_save = True

    if not getattr(settings, "currency_updated_at", None):
        settings.currency_updated_at = settings.updated_at
        needs_save = True

    if not hasattr(settings, "currency_updated_by"):
        settings.currency_updated_by = None
        needs_save = True

    if not hasattr(settings, "quarterly_budget"):
        settings.quarterly_budget = None
        needs_save = True

    if not hasattr(settings, "quarterly_budget_updated_by"):
        settings.quarterly_budget_updated_by = None
        needs_save = True

    if not hasattr(settings, "quarterly_budget_updated_at"):
        settings.quarterly_budget_updated_at = None
        needs_save = True

    if needs_save:
        await settings.save()
    _settings_cache = settings
    return settings


async def get_system_settings() -> SystemSettings:
    return await _ensure_settings()


async def get_system_timezone() -> ZoneInfo:
    settings = await _ensure_settings()
    return ZoneInfo(settings.timezone)


async def get_system_timezone_name() -> str:
    settings = await _ensure_settings()
    return settings.timezone


async def get_current_time() -> datetime:
    tz = await get_system_timezone()
    return datetime.now(tz)


async def get_current_date() -> date:
    return (await get_current_time()).date()


async def update_system_timezone(tz_name: str, user_id: ObjectId) -> SystemSettings:
    try:
        tz = ZoneInfo(tz_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError(f"Unsupported timezone: {tz_name}") from exc

    settings = await _ensure_settings()
    settings.timezone = tz.key
    settings.updated_by = user_id
    settings.updated_at = datetime.now(timezone.utc)
    await settings.save()

    global _settings_cache
    _settings_cache = settings
    return settings


def list_timezones(search: Optional[str] = None, limit: int = 500) -> List[str]:
    zones = sorted(available_timezones())
    if search:
        query = search.lower()
        zones = [zone for zone in zones if query in zone.lower()]
    if limit:
        return zones[:limit]
    return zones


async def get_system_currency() -> str:
    settings = await _ensure_settings()
    return settings.currency


def _normalize_currency_code(code: str) -> str:
    normalized = code.strip().upper()
    if normalized not in SUPPORTED_CURRENCY_CODES:
        raise ValueError(f"Unsupported currency: {code}")
    return normalized


async def update_system_currency(currency_code: str, user_id: ObjectId) -> SystemSettings:
    normalized_code = _normalize_currency_code(currency_code)

    settings = await _ensure_settings()
    settings.currency = normalized_code
    settings.currency_updated_by = user_id
    settings.currency_updated_at = datetime.now(timezone.utc)
    await settings.save()

    global _settings_cache
    _settings_cache = settings
    return settings


async def get_quarterly_budget() -> Optional[float]:
    settings = await _ensure_settings()
    return settings.quarterly_budget


async def update_quarterly_budget(budget: float, user_id: ObjectId) -> SystemSettings:
    if budget < 0:
        raise ValueError("Budget must be non-negative")
    settings = await _ensure_settings()
    settings.quarterly_budget = float(budget)
    settings.quarterly_budget_updated_by = user_id
    settings.quarterly_budget_updated_at = datetime.now(timezone.utc)
    await settings.save()
    global _settings_cache
    _settings_cache = settings
    return settings


def list_currencies(search: Optional[str] = None, limit: int = 100) -> List[dict[str, str]]:
    currencies = SUPPORTED_CURRENCIES
    if search:
        query = search.lower()
        currencies = [
            currency
            for currency in currencies
            if query in currency["code"].lower() or query in currency["name"].lower()
        ]
    currencies = sorted(currencies, key=lambda item: item["code"])
    if limit:
        return currencies[:limit]
    return currencies
