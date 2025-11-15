"""Routes for authentication."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import auth
from ..config import Settings, get_settings
from ..database import get_session
from ..models import User
from ..schemas import AuthResponse, LoginRequest, UserCreate, UserRead

router = APIRouter()


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register_user(
    payload: UserCreate,
    session: AsyncSession = Depends(get_session),
) -> User:
    """Create a new user if the email address is not already registered."""
    existing = await session.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered.",
        )

    user = User(
        email=payload.email.lower(),
        password_hash=auth.get_password_hash(payload.password),
        display_name=payload.display_name,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate a user and return an access token",
)
async def login_user(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    """Verify credentials and return a bearer token."""
    result = await session.execute(
        select(User).where(User.email == payload.email.lower())
    )
    user = result.scalar_one_or_none()

    if user is None or not auth.verify_password(
        payload.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = auth.create_access_token(subject=str(user.id), settings=settings)
    return AuthResponse(access_token=token, token_type="bearer", user=user)

