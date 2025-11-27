import asyncio
from datetime import date

from app.database import init_db, close_db
from app.models.adjustment import AdjustmentType


async def seed():
    templates = [
        {
            "name": "CPP",
            "direction": "deduct",
            "mode": "percent",
            "rate_or_amount": 5.95,
            "cap_per_period": None,
            "apply_on": "all",
            "overtime_rule": "none",
            "applies_globally": True,
            "note": "2025 rate 5.95% up to YMPE; adjust cap per period if needed.",
            "effective_start": date.today(),
        },
        {
            "name": "EI",
            "direction": "deduct",
            "mode": "percent",
            "rate_or_amount": 1.66,
            "cap_per_period": None,
            "apply_on": "all",
            "overtime_rule": "none",
            "applies_globally": True,
            "note": "2025 rate 1.66% up to MIE; set per-period cap when known.",
            "effective_start": date.today(),
        },
        {
            "name": "Federal Tax",
            "direction": "deduct",
            "mode": "percent",
            "rate_or_amount": 0.0,
            "cap_per_period": None,
            "apply_on": "all",
            "overtime_rule": "none",
            "applies_globally": True,
            "note": "Set based on CRA tables/TD1; placeholder 0%.",
            "effective_start": date.today(),
        },
        {
            "name": "Nova Scotia Tax",
            "direction": "deduct",
            "mode": "percent",
            "rate_or_amount": 0.0,
            "cap_per_period": None,
            "apply_on": "all",
            "overtime_rule": "none",
            "applies_globally": True,
            "note": "Set based on NS brackets/TD1NS; placeholder 0%.",
            "effective_start": date.today(),
        },
        {
            "name": "Overtime Premium",
            "direction": "add",
            "mode": "percent",
            "rate_or_amount": 50.0,
            "cap_per_period": None,
            "apply_on": "overtime_only",
            "overtime_rule": "40h_week",
            "applies_globally": False,
            "note": "Example premium for overtime; adjust as needed.",
            "effective_start": date.today(),
        },
    ]

    for tpl in templates:
        existing = await AdjustmentType.find_one(AdjustmentType.name == tpl["name"])
        if existing:
            continue
        adjustment = AdjustmentType(**tpl)
        await adjustment.insert()
        print(f"Seeded adjustment type: {tpl['name']}")


async def main():
    await init_db()
    try:
        await seed()
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
