# VirtuAssist React frontend

## Run locally

1. Start your Django backend first at `http://127.0.0.1:8000`.
2. Open a terminal in this folder.
3. Install packages if needed: `npm install`
4. Start Vite: `npm run dev`
5. Open the local URL printed by Vite.

The API base URL defaults to `http://127.0.0.1:8000/api`. To change it, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

## Expected Django API endpoints

- `POST /api/login/` returns `access` and `refresh`
- `POST /api/token/refresh/` accepts `{ "refresh": "..." }` and returns `access`
- `GET /api/conversations/` returns a list of conversations (or `{ "results": [...] }`)
- `POST /api/conversations/` accepts `{ "title": "New Chat" }`
- `GET /api/conversations/<id>/` returns an object containing `messages` or `chats`
- `POST /api/chat/` accepts `{ "conversation_id": <id>, "message": "..." }`

If your Django URL names or response fields differ, those endpoints need to be aligned with the backend.
"# VirtuAssist-Frontend" 
