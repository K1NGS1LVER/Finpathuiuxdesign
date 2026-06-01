from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    groq_api_key: str = ""
    groq_primary_model: str = "llama-3.3-70b-versatile"
    groq_fallback_model: str = "llama-3.1-8b-instant"
    host: str = "127.0.0.1"
    port: int = 8000
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Supabase auth (Phase 1)
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwt_aud: str = "authenticated"
    supabase_jwt_algorithm: str = "HS256"

    # Supabase REST (Phase 3 — DB writes via PostgREST under user JWT)
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""  # only used by proposal-expiry job

    # Dev escape hatch — bypass JWT verification entirely. Mirror of the
    # frontend's VITE_AUTH_MOCK toggle. Never enable in production.
    auth_mock: bool = False

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
