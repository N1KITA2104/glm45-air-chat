"""Routes for user profile management."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import attributes

from ..config import Settings, get_settings
from ..database import get_session
from ..deps import get_current_user
from ..models import User, EmailVerificationCode
from ..schemas import UserRead, UserUpdate, VerifyEmailRequest
from ..services.email import generate_verification_code, send_verification_email

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


@router.post(
    "/send-verification-code",
    status_code=status.HTTP_200_OK,
    summary="Send email verification code",
)
async def send_verification_code(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    """Send a verification code to the current user's email."""
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified.",
        )

    # Delete old unused codes for this user
    await session.execute(
        delete(EmailVerificationCode).where(
            EmailVerificationCode.user_id == current_user.id
        )
    )

    # Generate new code
    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    verification_code = EmailVerificationCode(
        user_id=current_user.id,
        code=code,
        expires_at=expires_at,
    )
    session.add(verification_code)
    await session.commit()

    # Send email
    try:
        await send_verification_email(current_user.email, code, settings)
    except Exception as e:
        await session.delete(verification_code)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}",
        )

    return {"message": "Verification code sent to your email."}


@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
    summary="Verify email with code",
)
async def verify_email(
    payload: VerifyEmailRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    """Verify email address with the provided code."""
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified.",
        )

    # Find the verification code
    result = await session.execute(
        select(EmailVerificationCode)
        .where(EmailVerificationCode.user_id == current_user.id)
        .where(EmailVerificationCode.code == payload.code)
        .order_by(EmailVerificationCode.created_at.desc())
    )
    verification_code = result.scalar_one_or_none()

    if not verification_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    if not verification_code.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired or already been used.",
        )

    # Mark code as used and verify email
    verification_code.used = True
    current_user.email_verified = True
    session.add(verification_code)
    session.add(current_user)
    await session.commit()

    return {"message": "Email verified successfully."}

