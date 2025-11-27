from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=20)
    name: str
    email: EmailStr
    pay_rate: float = Field(..., gt=0)
    password: str = Field(..., min_length=6)
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "jdoe",
                "name": "John Doe",
                "email": "jdoe@example.com",
                "pay_rate": 25.0,
                "password": "SecurePass123"
            }
        }

class UserResponse(BaseModel):
    id: str
    username: str
    name: str
    email: str
    role: Literal["admin", "employee"]
    pay_rate: float
    status: Literal["active", "disabled"]
    created_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    pay_rate: Optional[float] = Field(None, gt=0)
    status: Optional[Literal["active", "disabled"]] = None

class EmployeeSummary(BaseModel):
    id: str
    username: str
    name: str
    email: str
    pay_rate: float
    status: Literal["active", "disabled", "deleted"]
    last_clock_out: Optional[datetime]
    created_at: datetime

class EmployeeSearchResult(BaseModel):
    id: str
    username: str
    name: str
    email: str
    status: Literal["active", "disabled"]

class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=6)
    
    class Config:
        json_schema_extra = {
            "example": {
                "new_password": "NewSecurePass123"
            }
        }
