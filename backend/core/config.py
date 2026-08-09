import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tracora API"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # In production, use a strong env variable
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # We use SQLite for easy local setup. Can swap to postgres easily:
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./tasktact.db"

settings = Settings()
