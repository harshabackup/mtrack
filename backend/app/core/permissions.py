from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .database import get_db
from .security import SECRET_KEY, ALGORITHM
from ..models.user import User
from ..models.role import Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def require_vendor(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Both ADMIN and USER can access vendor routes.
    # If a user/admin has no vendor_id assigned, assign or fallback to vendor 1 or first available vendor.
    if not current_user.vendor_id:
        from ..models.vendor import Vendor
        first_vendor = db.query(Vendor).order_by(Vendor.id.asc()).first()
        if first_vendor:
            current_user.vendor_id = first_vendor.id
            try:
                db.commit()
            except Exception:
                db.rollback()
        else:
            current_user.vendor_id = 1
    return current_user

def require_admin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if not role or role.name != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrative privileges required.")
    return current_user
