"""Seed script to insert fake employee accounts."""
import asyncio
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.database import init_db
from app.models.user import User
from app.utils.security import hash_password

PASSWORD = "sarb7479"
TOTAL_EMPLOYEES = 50

FIRST_NAMES = [
    "Ava",
    "Noah",
    "Liam",
    "Emma",
    "Olivia",
    "Ethan",
    "Mason",
    "Sophia",
    "Isabella",
    "Mia",
    "Charlotte",
    "Amelia",
    "Harper",
    "Evelyn",
    "Abigail",
    "Emily",
    "Elijah",
    "Logan",
    "Jacob",
    "Michael",
]

LAST_NAMES = [
    "Anderson",
    "Brown",
    "Martinez",
    "Davis",
    "Wilson",
    "Moore",
    "Taylor",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
    "Clark",
    "Lewis",
    "Young",
    "Hall",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Green",
]


def _unique_username(first: str, last: str, suffix: int) -> str:
    base = f"{first}{last}".lower()
    return f"{base}{suffix}".replace(" ", "")


async def seed_fake_employees(total: int = TOTAL_EMPLOYEES):
    await init_db()
    password_hash = hash_password(PASSWORD)
    created = 0
    attempts = 0

    while created < total and attempts < total * 3:
        attempts += 1
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        suffix = random.randint(100, 999)
        username = _unique_username(first, last, suffix)
        email = f"{username}@example.com"

        existing = await User.find_one(User.username == username)
        if existing:
            continue

        pay_rate = round(random.uniform(18.0, 45.0), 2)
        employee = User(
            username=username,
            password_hash=password_hash,
            role="employee",
            name=name,
            email=email,
            pay_rate=pay_rate,
            status="active",
        )
        await employee.insert()
        created += 1
        print(f"Created employee #{created}: {name} ({username}) at ${pay_rate}/hr")

    if created < total:
        print(f"Finished with {created} employees created (target {total}).")
    else:
        print(f"Successfully created {created} employees.")


if __name__ == "__main__":
    asyncio.run(seed_fake_employees())
