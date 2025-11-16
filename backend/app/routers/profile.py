"""Routes for user profile management."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import attributes

from ..database import get_session
from ..deps import get_current_user
from ..models import User
from ..schemas import UserRead, UserUpdate

router = APIRouter()


@router.get(
    "/me",
    response_model=UserRead,
    summary="Fetch the current user's profile",
)
async def read_profile(current_user: User = Depends(get_current_user)) -> User:
    """Return the authenticated user's profile information."""
    return current_user


@router.patch(
    "/me",
    response_model=UserRead,
    summary="Update the current user's profile",
)
async def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Update profile fields for the authenticated user."""
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    
    if payload.settings is not None:
        # Merge settings with existing ones
        if current_user.settings is None:
            current_user.settings = {}
        current_user.settings.update(payload.settings)
        # Mark the JSONB field as modified so SQLAlchemy knows to update it
        attributes.flag_modified(current_user, "settings")
    
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

