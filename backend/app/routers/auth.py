"""Routes for authentication."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from .. import auth
from ..config import Settings, get_settings
from ..database import get_session
from ..models import User, EmailVerificationCode
from ..schemas import AuthResponse, LoginRequest, UserCreate, UserRead, PasswordResetRequest, PasswordResetVerify
from ..services.email import generate_verification_code, send_verification_email, send_password_reset_email

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
    settings: Settings = Depends(get_settings),
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
        email_verified=False,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    # Send verification code
    if settings.smtp_user and settings.smtp_password and settings.smtp_from_email:
        try:
            # Delete any old codes
            await session.execute(
                delete(EmailVerificationCode).where(
                    EmailVerificationCode.user_id == user.id
                )
            )

            # Generate new code
            code = generate_verification_code()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

            verification_code = EmailVerificationCode(
                user_id=user.id,
                code=code,
                expires_at=expires_at,
            )
            session.add(verification_code)
            await session.commit()

            # Send email (don't fail registration if email fails)
            try:
                await send_verification_email(user.email, code, settings)
            except Exception:
                pass  # Email sending failed, but user is registered
        except Exception:
            pass  # Verification code creation failed, but user is registered

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


@router.post(
    "/request-password-reset",
    status_code=status.HTTP_200_OK,
    summary="Request password reset code",
)
async def request_password_reset(
    payload: PasswordResetRequest,
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    """Send a password reset code to the email address."""
    # Check if user exists
    result = await session.execute(
        select(User).where(User.email == payload.email.lower())
    )
    user = result.scalar_one_or_none()

    # Always return success message (security: don't reveal if email exists)
    if not user:
        return {"message": "If the email exists, a password reset code has been sent."}

    # Delete old unused codes for this user
    await session.execute(
        delete(EmailVerificationCode).where(
            EmailVerificationCode.user_id == user.id
        )
    )

    # Generate new code
    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    verification_code = EmailVerificationCode(
        user_id=user.id,
        code=code,
        expires_at=expires_at,
    )
    session.add(verification_code)
    await session.commit()

    # Send email
    try:
        await send_password_reset_email(user.email, code, settings)
    except Exception as e:
        await session.delete(verification_code)
        await session.commit()
        # Still return success for security
        return {"message": "If the email exists, a password reset code has been sent."}

    return {"message": "If the email exists, a password reset code has been sent."}


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset password with verification code",
)
async def reset_password(
    payload: PasswordResetVerify,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    """Reset password using verification code."""
    # Find user
    result = await session.execute(
        select(User).where(User.email == payload.email.lower())
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or verification code.",
        )

    # Find the verification code
    code_result = await session.execute(
        select(EmailVerificationCode)
        .where(EmailVerificationCode.user_id == user.id)
        .where(EmailVerificationCode.code == payload.code)
        .order_by(EmailVerificationCode.created_at.desc())
    )
    verification_code = code_result.scalar_one_or_none()

    if not verification_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or verification code.",
        )

    if not verification_code.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired or already been used.",
        )

    # Reset password and verify email if not already verified
    verification_code.used = True
    user.password_hash = auth.get_password_hash(payload.new_password)
    
    # Auto-verify email if not already verified
    if not user.email_verified:
        user.email_verified = True
    
    session.add(verification_code)
    session.add(user)
    await session.commit()

    return {"message": "Password has been reset successfully. Your email has been verified."}
