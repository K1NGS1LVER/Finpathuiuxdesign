"""Supabase JWT verification. Phase 1 + RS256 support.

Verifies the Bearer token attached by the frontend. Auto-detects the
token's algorithm from its header:

- HS256: legacy/symmetric. Verified with `SUPABASE_JWT_SECRET`.
- RS256/ES256: asymmetric. Verified against Supabase's JWKS endpoint
  at `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`. Newer Supabase
  projects sign with asymmetric keys by default.

The verified `sub` claim is the user's UUID — returned for use in
route handlers (and later, RLS-aware queries).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientError

from app.config import settings

log = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)

MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"

_SYMMETRIC_ALGS = {"HS256", "HS384", "HS512"}
_ASYMMETRIC_ALGS = {"RS256", "RS384", "RS512", "ES256", "ES384", "ES512"}


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    email: str | None
    role: str | None
    access_token: str | None = None  # raw JWT, for PostgREST proxying


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient | None:
    url = (settings.supabase_url or "").rstrip("/")
    if not url:
        return None
    jwks_url = f"{url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=600)


def _decode(token: str, alg: str) -> dict:
    common_kwargs = dict(
        algorithms=[alg],
        audience=settings.supabase_jwt_aud,
        options={"require": ["exp", "sub"]},
    )

    if alg in _SYMMETRIC_ALGS:
        if not settings.supabase_jwt_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="SUPABASE_JWT_SECRET missing on backend.",
            )
        return jwt.decode(token, settings.supabase_jwt_secret, **common_kwargs)

    if alg in _ASYMMETRIC_ALGS:
        jwks = _jwks_client()
        if jwks is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="SUPABASE_URL missing on backend (needed for JWKS).",
            )
        signing_key = jwks.get_signing_key_from_jwt(token).key
        return jwt.decode(token, signing_key, **common_kwargs)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Unsupported token algorithm: {alg}",
    )


async def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    if settings.auth_mock:
        request.state.user_id = MOCK_USER_ID
        return CurrentUser(user_id=MOCK_USER_ID, email="dev@finpath.local", role="authenticated")

    if creds is None or creds.scheme.lower() != "bearer" or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = creds.credentials

    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token header could not be parsed.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from exc

    alg = (header.get("alg") or "").upper()
    if not alg:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing alg in header.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )

    try:
        payload = _decode(token, alg)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from None
    except (jwt.InvalidTokenError, PyJWKClientError) as exc:
        log.warning("JWT verification failed (alg=%s): %s", alg, exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Unexpected error verifying token (alg=%s)", alg)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub claim."
        )

    request.state.user_id = user_id
    return CurrentUser(
        user_id=user_id,
        email=payload.get("email") if isinstance(payload.get("email"), str) else None,
        role=payload.get("role") if isinstance(payload.get("role"), str) else None,
        access_token=token,
    )
