from fastapi import APIRouter, HTTPException, status
import logging

from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse
from app.utils.security import verify_password, create_access_token, hash_password
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT token."""
    # Find user by username
    user = await User.find_one(User.username == request.username)
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Contact admin for reset."
        )
    
    if user.status == "disabled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "user_id": str(user.id),
            "username": user.username,
            "role": user.role
        }
    )
    
    return LoginResponse(
        access_token=access_token,
        user_id=str(user.id),
        username=user.username,
        role=user.role,
        name=user.name,
        email=user.email
    )

@router.post("/seed-admin")
async def seed_admin():
    """Create initial admin user if none exists."""
    # Check if any admin exists
    existing_admin = await User.find_one(User.role == "admin")
    
    if existing_admin:
        return {"message": "Admin already exists", "username": existing_admin.username}
    
    # Create admin user
    admin = User(
        username=settings.ADMIN_USERNAME,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        role="admin",
        name=settings.ADMIN_NAME,
        email=settings.ADMIN_EMAIL,
        pay_rate=0.0,  # Admin doesn't have pay rate
        status="active"
    )
    
    await admin.insert()
    
    logger.info(f"Admin user created: {admin.username}")
    
    return {
        "message": "Admin user created successfully",
        "username": admin.username,
        "password": "(as configured in .env)"
    }
