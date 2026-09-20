from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Configuration Settings.
    Loaded from environment variables or defaults.
    """
    app_name: str = "IAMFixer"
    environment: str = "development"
    log_level: str = "INFO"
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]
    )

    # AI Provider Configuration: "auto" | "bedrock" | "baseline"
    iamfixer_ai_provider: str = Field(default="auto", alias="IAMFIXER_AI_PROVIDER")

    # AWS Bedrock Settings (Optional, resolved dynamically via environment/AWS config)
    aws_region: Optional[str] = Field(default=None, alias="AWS_REGION")
    aws_access_key_id: Optional[str] = Field(default=None, alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = Field(default=None, alias="AWS_SECRET_ACCESS_KEY")
    aws_session_token: Optional[str] = Field(default=None, alias="AWS_SESSION_TOKEN")
    bedrock_model_id: Optional[str] = Field(default=None, alias="BEDROCK_MODEL_ID")

    # Database Settings
    database_url: str = Field(default="sqlite:///./iamfixer.db", alias="DATABASE_URL")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

