"""Seed script to create the initial admin user."""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.database import init_db
from app.models.user import User
from app.utils.security import hash_password
from app.config import settings

async def seed_admin():
    """Create admin user if it doesn't exist."""
    await init_db()
    
    # Check if admin exists
    existing_admin = await User.find_one(User.role == "admin")
    
    if existing_admin:
        print(f"Admin user already exists: {existing_admin.username}")
        return
    
    # Create admin
    admin = User(
        username=settings.ADMIN_USERNAME,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        role="admin",
        name=settings.ADMIN_NAME,
        email=settings.ADMIN_EMAIL,
        pay_rate=0.0,
        status="active"
    )
    
    await admin.insert()
    
    print(f"Admin user created successfully!")
    print(f"Username: {admin.username}")
    print(f"Password: {settings.ADMIN_PASSWORD}")
    print(f"Email: {admin.email}")

if __name__ == "__main__":
    asyncio.run(seed_admin())
