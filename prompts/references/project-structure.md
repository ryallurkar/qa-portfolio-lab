# Project Structure

## File layout

```
tests/
  api/              # API contract tests        → *.api.spec.ts
  e2e/              # Browser E2E tests         → *.e2e.spec.ts
  pages/            # Page Object classes       → FeatureNamePage.ts
  helpers/
    api.ts          # getAuthToken(), authHeaders(), API_BASE_URL
    selectors.ts    # ALL data-testid values — single source of truth
  fixtures.ts       # Extended test fixtures — import test from here for API tests
  global-setup.ts   # Seeds DB + caches alice auth before suite
  generated/        # AI draft specs — review only, not run in CI
```

## Playwright projects

| Project | Pattern | Auth state | Run command |
|---------|---------|-----------|-------------|
| `chromium` | `**/*.e2e.spec.ts` | `.auth/user.json` (alice) | `npm run test:e2e` |
| `api` | `**/*.api.spec.ts` | none | `npm run test:api` |
| `generated` | `tests/generated/**/*.spec.ts` | none | `npm run test:generated` |
