"""Email service for sending verification codes."""

from __future__ import annotations

import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..config import Settings


def generate_verification_code() -> str:
    """Generate a 6-digit verification code."""
    return f"{random.randint(100000, 999999)}"


def send_verification_email_sync(
    email: str,
    code: str,
    settings: Settings,
) -> None:
    """Send verification code email via SMTP (synchronous)."""
    if not settings.smtp_user or not settings.smtp_password or not settings.smtp_from_email:
        raise ValueError("SMTP configuration is incomplete. Please set SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL environment variables.")

    # Create message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Email Verification Code"
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = email

    # Create HTML email body
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6c5ce7;">Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering with {settings.app_name}!</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; border: 2px solid #6c5ce7; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #6c5ce7; margin: 0; font-size: 32px; letter-spacing: 4px;">{code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      </body>
    </html>
    """

    # Create plain text email body
    text_body = f"""
Email Verification

Hello,

Thank you for registering with {settings.app_name}!

Your verification code is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.
"""

    # Attach both parts
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    # Send email
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        raise RuntimeError(f"Failed to send email: {str(e)}") from e


async def send_verification_email(
    email: str,
    code: str,
    settings: Settings,
) -> None:
    """Send verification code email via SMTP (async wrapper)."""
    import asyncio
    await asyncio.to_thread(send_verification_email_sync, email, code, settings)


def send_password_reset_email_sync(
    email: str,
    code: str,
    settings: Settings,
) -> None:
    """Send password reset code email via SMTP (synchronous)."""
    if not settings.smtp_user or not settings.smtp_password or not settings.smtp_from_email:
        raise ValueError("SMTP configuration is incomplete. Please set SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL environment variables.")

    # Create message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset Code"
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = email

    # Create HTML email body
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6c5ce7;">Password Reset</h2>
          <p>Hello,</p>
          <p>You requested to reset your password for {settings.app_name}.</p>
          <p>Your password reset code is:</p>
          <div style="background-color: #f5f5f5; border: 2px solid #6c5ce7; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #6c5ce7; margin: 0; font-size: 32px; letter-spacing: 4px;">{code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      </body>
    </html>
    """

    # Create plain text email body
    text_body = f"""
Password Reset

Hello,

You requested to reset your password for {settings.app_name}.

Your password reset code is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email and your password will remain unchanged.
"""

    # Attach both parts
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    # Send email
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        raise RuntimeError(f"Failed to send email: {str(e)}") from e


async def send_password_reset_email(
    email: str,
    code: str,
    settings: Settings,
) -> None:
    """Send password reset code email via SMTP (async wrapper)."""
    import asyncio
    await asyncio.to_thread(send_password_reset_email_sync, email, code, settings)

