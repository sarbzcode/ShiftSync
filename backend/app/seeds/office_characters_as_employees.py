import asyncio
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.database import init_db
from app.models.user import User
from app.utils.security import hash_password

PASSWORD = "sarb7479"
NAMES = [
    "Michael Scott",
    "Dwight Schrute",
    "Jim Halpert",
    "Pam Beesly",
    "Ryan Howard",
    "Kelly Kapoor",
    "Angela Martin",
    "Oscar Martinez",
    "Kevin Malone",
    "Stanley Hudson",
    "Phyllis Vance",
    "Creed Bratton",
    "Toby Flenderson",
    "Andy Bernard",
    "Darryl Philbin",
]


def _username_from_name(name: str) -> str:
    return name.replace(" ", "").lower()


async def seed_office_employees() -> None:
    await init_db()
    password_hash = hash_password(PASSWORD)
    created = 0

    for name in NAMES:
        username = _username_from_name(name)
        email = f"{username}@office.com"

        existing = await User.find_one(User.username == username)
        if existing:
            print(f"Skipping existing user: {username}")
            continue

        pay_rate = round(random.uniform(18.0, 40.0), 2)
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
        print(f"Created {name} ({username}) at ${pay_rate}/hr")

    print(f"Finished. Created {created} new Office employees.")


if __name__ == "__main__":
    asyncio.run(seed_office_employees())
