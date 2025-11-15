# AI Chat Platform

This repository contains a full-stack chat application that integrates Z.AI's **GLM 4.5 Air Free** model via the OpenRouter API. It delivers a contextual chat experience with FastAPI + PostgreSQL on the backend and a React (Vite) frontend powered by `llm-ui` for smooth LLM output rendering.

> 💡 Default model: [`z-ai/glm-4.5-air:free`](https://openrouter.ai/z-ai/glm-4.5-air/api?utm_source=openai)

---

## Features

- 🔐 JWT authentication with registration, login, and profile editing
- 💬 Chat management (create, rename, delete) with contextual memory
- 🧠 OpenRouter integration for GLM 4.5 Air Free responses
- 🧩 `llm-ui` rendering for markdown/code-friendly assistant replies
- 📱 Responsive React UI with chat sidebar, history, and streaming-friendly output
- 🧪 Basic health-check test suite for the FastAPI service

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **PostgreSQL** ≥ 14
- OpenRouter account + API key (model: GLM 4.5 Air Free)

---

## Backend Setup (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with your database connection string and `OPEN_ROUTER_API_KEY`.

**Note:** By default, CORS is configured to allow requests from `http://localhost:5173` (dev) and `http://localhost:4173` (preview). To add more origins, set `BACKEND_CORS_ORIGINS` in `.env` as a comma-separated list.

Run migrations/DDL by starting the app once (tables auto-create):

```bash
uvicorn app.main:app --reload
```

---

## Frontend Setup (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
# if backend runs elsewhere, update VITE_API_BASE_URL
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Running Tests

```bash
cd backend
pytest
```

(Uses an on-disk SQLite database for isolation.)

---

## API Overview

- `POST /auth/register` – create new user
- `POST /auth/login` – authenticate and receive JWT
- `GET /profile/me` – authenticated user profile
- `PATCH /profile/me` – update display name
- `GET /chats` – list chats for user
- `POST /chats` – create chat (optional custom title/model)
- `PATCH /chats/{chat_id}` – rename chat
- `DELETE /chats/{chat_id}` – delete chat
- `GET /chats/{chat_id}/messages` – list messages
- `POST /chats/{chat_id}/messages` – send prompt & receive model reply

---

## Development Tips

- Configure `BACKEND_CORS_ORIGINS` for additional frontends (comma-separated).
- Adjust `OPENROUTER_TEMPERATURE` or `SYSTEM_PROMPT` in `.env` to tune assistant behaviour.
- `llm-ui` is ready for streaming; the current implementation renders completed responses but is open for future streaming upgrades.

---

## License

MIT © 2025 AI Chat Platform contributors.

