from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_TITLE: str = "Cluster"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str = "postgresql://cluster_user:password@db:5432/clusterdb"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-long-random-string"

    # DeepSeek API (chat only - no embeddings endpoint)
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_CHAT_MODEL: str = "deepseek-chat"
    
    # Embeddings: использовать локальный TF-IDF fallback или альтернативный сервис
    # (DeepSeek не поддерживает /v1/embeddings)
    USE_DEEPSEEK_EMBEDDINGS: bool = False  # В данный момент невозможно
    EMBEDDING_SERVICE: str = "local_tfidf"  # Опции: "local_tfidf", "openai", "other"
    EMBEDDINGS_API_KEY: str = ""  # Для альтернативного сервиса (если нужен)

    # AVALIN 3D Tours integration
    AVALIN_API_URL: str = "https://api.avalin.ru"
    AVALIN_API_KEY: str = ""
    AVALIN_CDN_URL: str = "https://cdn.avalin.ru/viewer/latest"

    # Business Partner Features
    BUSINESS_PARTNER_ENABLED: bool = True
    SPECIAL_OFFERS_ENABLED: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )


settings = Settings()
