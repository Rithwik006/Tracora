from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=4, max_length=72, description="Password must be between 4 and 72 characters")


# Task
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

# TaskUpdate: all fields optional so partial updates (e.g. just is_completed) work correctly
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None

class TaskResponse(TaskBase):
    id: int
    is_completed: bool
    created_at: datetime
    owner_id: int

    model_config = ConfigDict(from_attributes=True)

# User
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=4, max_length=72, description="Password must be between 4 and 72 characters")

class UserResponse(UserBase):
    id: int
    is_active: bool
    tasks: List[TaskResponse] = []

    model_config = ConfigDict(from_attributes=True)
