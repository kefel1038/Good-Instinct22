from datetime import datetime, timedelta
import hashlib
import secrets
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "neewrs-uganda-secret-key-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer()

users_db = {}
tokens_db = {}

ROLES = ["ministry", "district_officer", "hospital", "field_worker"]

def hash_password(password: str) -> str:
    salt = secrets.token_hex(8)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${h}"

def verify_password(plain: str, hashed: str) -> bool:
    salt, h = hashed.split("$")
    return hashlib.sha256((salt + plain).encode()).hexdigest() == h

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return decode_token(credentials.credentials)

def seed_users():
    users = [
        {"username": "admin", "password": "admin123", "role": "ministry", "name": "Dr. Ministry Admin", "district": "Kampala"},
        {"username": "district", "password": "district123", "role": "district_officer", "name": "District Health Officer", "district": "Wakiso"},
        {"username": "hospital", "password": "hospital123", "role": "hospital", "name": "Dr. Mulago Hospital", "district": "Kampala"},
        {"username": "worker", "password": "worker123", "role": "field_worker", "name": "VHT Alice", "district": "Gulu"},
    ]
    for u in users:
        users_db[u["username"]] = {
            "username": u["username"],
            "password": hash_password(u["password"]),
            "role": u["role"],
            "name": u["name"],
            "district": u["district"],
        }

seed_users()
