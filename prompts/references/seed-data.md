# Seed Data

Every run starts from a clean seeded state. `npm run db:seed` is called in `global-setup.ts`.

| Username | Password | Notes |
|----------|----------|-------|
| alice | !password123 | Default authenticated user in all tests |
| bob | !password123 | Common receiver — use `bobId` fixture, never hardcode id |
| carol | !password123 | Available |
| dave | !password123 | Available |
| eve | !password123 | Available |

- Seed inserts **7 kudos** — tests asserting count must account for this baseline
- `bobId` fixture resolves dynamically from `GET /auth/users` — never hardcode a DB id
