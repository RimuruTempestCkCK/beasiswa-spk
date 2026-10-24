from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/beasiswa_spk"

    # JWT
    SECRET_KEY: str = "beasiswa-spk-super-secret-key-2026-production-ready"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # File storage
    ARTIFACTS_DIR: str = "./artifacts"
    UPLOADS_DIR: str = "./uploads"

    # App
    APP_NAME: str = "Beasiswa SPK API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    def get_artifacts_dir(self) -> str:
        os.makedirs(self.ARTIFACTS_DIR, exist_ok=True)
        return self.ARTIFACTS_DIR

    def get_uploads_dir(self) -> str:
        os.makedirs(self.UPLOADS_DIR, exist_ok=True)
        return self.UPLOADS_DIR


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
