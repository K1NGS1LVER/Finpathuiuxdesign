"""Supabase JWT verification. Phase 1.

Verifies the Bearer token attached by the frontend (via apiFetch).
Supabase issues HS256 JWTs signed with the project's JWT secret.
The verified `sub` claim is the user's UUID — returned for use in
route handlers (and later, RLS-aware queries).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

log = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    email: str | None
    role: str | None


async def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured on the backend (SUPABASE_JWT_SECRET missing).",
        )

    if creds is None or creds.scheme.lower() != "bearer" or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            creds.credentials,
            settings.supabase_jwt_secret,
            algorithms=[settings.supabase_jwt_algorithm],
            audience=settings.supabase_jwt_aud,
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from None
    except jwt.InvalidTokenError as exc:
        log.warning("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub claim.")

    request.state.user_id = user_id
    return CurrentUser(
        user_id=user_id,
        email=payload.get("email") if isinstance(payload.get("email"), str) else None,
        role=payload.get("role") if isinstance(payload.get("role"), str) else None,
    )
