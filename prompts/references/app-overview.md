# App Overview

**Kudos** — a team recognition app. Authenticated users give kudos to colleagues.
A kudos has a message and a receiver. The wall shows all kudos newest-first.

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React + Vite + Zustand | `http://localhost:3000` |
| Backend API | Express + routing-controllers + class-validator | `http://localhost:3022` |
| Database | SQLite via Prisma | — |
| Auth | JWT — stored in `localStorage` as `accessToken` + `authUser` | — |
