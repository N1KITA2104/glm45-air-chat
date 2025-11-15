"""Pydantic schemas for request and response models."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """JWT response payload."""

    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    """Shared user properties."""

    id: UUID
    email: EmailStr
    display_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class UserCreate(BaseModel):
    """Payload for registering a new user."""

    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = Field(min_length=1, max_length=255)


class UserRead(UserBase):
    """User details returned to the client."""


class AuthResponse(Token):
    """Token plus user payload returned after login."""

    user: UserRead


class UserUpdate(BaseModel):
    """Payload for updating user profile information."""

    display_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    """Credentials for logging in."""

    email: EmailStr
    password: str = Field(min_length=8)


class ChatBase(BaseModel):
    """Chat fields shared across requests and responses."""

    id: UUID
    title: str
    model_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class ChatCreate(BaseModel):
    """Payload to create a new chat."""

    title: str | None = None
    model_name: str | None = None

    model_config = {"protected_namespaces": ()}


class ChatUpdate(BaseModel):
    """Payload to rename or update chat attributes."""

    title: str = Field(min_length=1, max_length=255)


class MessageBase(BaseModel):
    """Message details shared across requests and responses."""

    id: UUID
    chat_id: UUID
    role: str
    content: str
    model_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class MessageCreate(BaseModel):
    """Payload for sending a new user message."""

    content: str = Field(min_length=1, max_length=4000)


class MessageRead(MessageBase):
    """Message returned to the client."""


class ChatDetail(ChatBase):
    """Chat including its messages."""

    messages: list[MessageRead]

