from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Email Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@lumio.study"
    MAIL_FROM_NAME: str = "Lumio Study"
    USE_CONSOLE_EMAIL: bool = True
    BREVO_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Stripe Settings
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Paymongo Settings
    PAYMONGO_SECRET_KEY: str = ""
    PAYMONGO_WEBHOOK_SECRET: str = ""

    # General Settings
    FRONTEND_URL: str = "http://localhost:5173"
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
