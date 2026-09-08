import os
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt

import bcrypt

_IS_PRODUCTION = os.getenv("ENVIRONMENT", "production").lower() == "production"

# Fallback matches the value this app has always shipped with, so existing
# deployments that never set SECRET_KEY explicitly don't get every issued
# token invalidated by this default changing. Set SECRET_KEY in your
# environment to move off of this default.
_FALLBACK_SECRET_KEY = "supersecretkeythatyoushouldchangeinprod"

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if _IS_PRODUCTION:
        print("WARNING: SECRET_KEY is not set. Falling back to the default signing key — "
              "set SECRET_KEY in your environment to secure JWT issuance.")
    SECRET_KEY = _FALLBACK_SECRET_KEY

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # Defaults to 7 days

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
