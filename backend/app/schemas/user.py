from pydantic import BaseModel, EmailStr
from typing import Optional

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserSecurityUpdate(BaseModel):
    current_password: str
    new_password: str

class UserNotificationUpdate(BaseModel):
    notify_email: bool
    notify_new_proposals: bool
    notify_marketing: bool

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    notify_email: bool
    notify_new_proposals: bool
    notify_marketing: bool

    class Config:
        from_attributes = True
