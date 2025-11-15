"""Routes for chat management."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import Settings, get_settings
from ..database import get_session
from ..deps import get_current_user
from ..models import Chat, Message, User
from ..schemas import (
    ChatBase,
    ChatCreate,
    ChatDetail,
    ChatUpdate,
    MessageCreate,
    MessageRead,
)

router = APIRouter()


async def _get_chat_or_404(
    session: AsyncSession,
    chat_id: uuid.UUID,
    user: User,
    *,
    load_messages: bool = False,
) -> Chat:
    statement = select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id)
    if load_messages:
        statement = statement.options(selectinload(Chat.messages))

    result = await session.execute(statement)
    chat = result.scalar_one_or_none()
    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )
    return chat


@router.get(
    "/",
    response_model=list[ChatBase],
    summary="List chats for the current user",
)
async def list_chats(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[Chat]:
    result = await session.execute(
        select(Chat)
        .where(Chat.user_id == current_user.id)
        .order_by(Chat.updated_at.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/",
    response_model=ChatBase,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chat thread",
)
async def create_chat(
    payload: ChatCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> Chat:
    chat = Chat(
        user_id=current_user.id,
        title=payload.title or "New Chat",
        model_name=payload.model_name or settings.openrouter_model,
    )
    session.add(chat)
    await session.commit()
    await session.refresh(chat)
    return chat


@router.get(
    "/{chat_id}",
    response_model=ChatDetail,
    summary="Get a chat along with its messages",
)
async def get_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Chat:
    chat = await _get_chat_or_404(
        session, chat_id, current_user, load_messages=True
    )
    return chat


@router.patch(
    "/{chat_id}",
    response_model=ChatBase,
    summary="Rename an existing chat",
)
async def rename_chat(
    chat_id: uuid.UUID,
    payload: ChatUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Chat:
    chat = await _get_chat_or_404(session, chat_id, current_user)
    chat.title = payload.title
    session.add(chat)
    await session.commit()
    await session.refresh(chat)
    return chat


@router.delete(
    "/{chat_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
    summary="Delete a chat and its messages",
)
async def delete_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    chat = await _get_chat_or_404(session, chat_id, current_user)
    await session.delete(chat)
    await session.commit()


@router.get(
    "/{chat_id}/messages",
    response_model=list[MessageRead],
    summary="List messages in a chat",
)
async def list_messages(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[Message]:
    await _get_chat_or_404(session, chat_id, current_user)

    result = await session.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )
    return list(result.scalars().all())


@router.post(
    "/{chat_id}/messages",
    response_model=MessageRead,
    status_code=status.HTTP_201_CREATED,
    summary="Send a message and get a model response",
)
async def send_message(
    chat_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> Message:
    chat = await _get_chat_or_404(session, chat_id, current_user)

    if not settings.open_router_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenRouter API key is not configured on the server.",
        )

    user_message = Message(
        chat_id=chat.id,
        role="user",
        content=payload.content,
        model_name=None,
    )
    session.add(user_message)
    await session.flush()

    history_result = await session.execute(
        select(Message)
        .where(Message.chat_id == chat.id)
        .order_by(Message.created_at.desc())
        .limit(settings.openrouter_max_history)
    )
    history = list(history_result.scalars().all())
    history.reverse()

    messages_payload = [
        {"role": "system", "content": settings.system_prompt},
        *(
            {"role": message.role, "content": message.content}
            for message in history
        ),
    ]

    request_body = {
        "model": chat.model_name,
        "messages": messages_payload,
        "temperature": settings.openrouter_temperature,
    }

    headers = {
        "Authorization": f"Bearer {settings.open_router_api_key}",
        "Content-Type": "application/json",
    }
    if settings.app_name:
        headers["X-Title"] = settings.app_name
    if settings.backend_cors_origins:
        headers["HTTP-Referer"] = settings.backend_cors_origins[0]

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=request_body,
        )

    if response.status_code >= 400:
        await session.rollback()
        try:
            detail = response.json()
        except ValueError:
            detail = response.text
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream OpenRouter error: {detail}",
        )

    data = response.json()
    try:
        assistant_content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response format from OpenRouter.",
        ) from exc

    assistant_message = Message(
        chat_id=chat.id,
        role="assistant",
        content=assistant_content,
        model_name=chat.model_name,
    )
    session.add(assistant_message)
    chat.updated_at = datetime.now(timezone.utc)
    session.add(chat)
    await session.commit()
    await session.refresh(assistant_message)
    return assistant_message

