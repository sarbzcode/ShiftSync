import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.config import settings
from app.schemas.auth import TokenData

BCRYPT_MAX_LENGTH = 72  # bcrypt only reads the first 72 bytes
BCRYPT_DEFAULT_ROUNDS = 12

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > BCRYPT_MAX_LENGTH:
        raise ValueError("Password exceeds bcrypt's 72-byte limit.")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=BCRYPT_DEFAULT_ROUNDS))
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    try:
        plain_bytes = plain_password.encode("utf-8")
        if len(plain_bytes) > BCRYPT_MAX_LENGTH:
            return False
        hashed_bytes = (
            hashed_password.encode("utf-8")
            if isinstance(hashed_password, str)
            else hashed_password
        )
        return bcrypt.checkpw(
            plain_bytes,
            hashed_bytes,
        )
    except ValueError:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "aud": settings.JWT_AUDIENCE
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

def decode_access_token(token: str) -> Optional[TokenData]:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE
        )
        
        user_id: str = payload.get("user_id")
        username: str = payload.get("username")
        role: str = payload.get("role")
        
        if user_id is None or username is None or role is None:
            return None
        
        return TokenData(user_id=user_id, username=username, role=role)
    except JWTError:
        return None
