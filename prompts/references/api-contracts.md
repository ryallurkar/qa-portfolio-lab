# API Contracts

Base URL: `http://localhost:3022`

---

## `POST /auth/sign-in`
- No auth required
- Body: `{ username: string, password: string }`
- Returns: `{ accessToken: string }` — JWT, three dot-separated parts
- Errors: `400` missing fields, `403` wrong credentials

## `GET /auth/me`
- Auth required
- Returns: `{ id: number, username: string }` — **no password field**
- Errors: `401` missing/invalid/expired token

## `GET /auth/users`
- Auth required
- Returns: `Array<{ id: number, username: string }>` — **no password field on any item**
- Errors: `401` no token

## `POST /kudos`
- Auth required
- Body: `{ message: string, receiverId: number }`
- Validation (from `CreateKudosDto`):
  - `message`: string, not empty, not whitespace-only, min 3 chars, max 500 chars
  - `receiverId`: integer, min value 1 (floats, strings, 0, negatives all return `400`)
- `authorId` in the body is silently ignored — author always comes from the JWT
- Message is sanitized with `sanitize-html({ allowedTags: [] })` — HTML tags stripped, surrounding text preserved
- Returns: `{ id, message, authorId, receiverId, createdAt, author: { id, username }, receiver: { id, username } }`
- Errors: `400` validation failure, `401` no auth, `404` receiverId does not exist in DB

## `GET /kudos`
- No auth required
- Returns: array of kudos, ordered `createdAt DESC` (newest first)
- Each item: `{ id, message, authorId, receiverId, createdAt, author: { id, username }, receiver: { id, username } }`
- **No password field on author or receiver**

## `DELETE /kudos/:id`
- Auth required
- Returns: `204 No Content` — empty body
- Errors: `401` no/invalid token, `403` requester is not the author, `404` kudo does not exist
