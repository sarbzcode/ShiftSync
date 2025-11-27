from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=4, max_length=20)
    password: str = Field(..., min_length=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "Admin@12345"
            }
        }

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str
    name: str
    email: str

class TokenData(BaseModel):
    user_id: str
    username: str
    role: str
