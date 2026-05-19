from pydantic import BaseModel


class Case(BaseModel):
    location: str
    symptoms: list[str]
    temperature: float
    lat: float | None = None
    lng: float | None = None
    reported_by: str | None = None
    source: str = "web"


class LoginRequest(BaseModel):
    username: str
    password: str


class SMSReport(BaseModel):
    sender: str
    message: str
    location: str | None = None


class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    name: str
    district: str
