import os
from pydantic_settings import BaseSettings

def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", os.getenv("SQLALCHEMY_DATABASE_URI", "sqlite:///./tasktact.db"))
    # Render, Heroku, Supabase, Railway provide postgres:// which is deprecated in SQLAlchemy 1.4+
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tracora API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SQLALCHEMY_DATABASE_URI: str = get_database_url()

settings = Settings()
