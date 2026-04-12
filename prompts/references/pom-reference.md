# Page Objects & Selectors

## Selector rules

All `data-testid` values live in `tests/helpers/selectors.ts`.
**Never hardcode a testid string in a spec or POM — always import from `selectors`.**

```ts
import { selectors } from '../helpers/selectors';
page.getByTestId(selectors.createKudosBtn);  // ✓
page.getByTestId('create-kudos-btn');         // ✗
```

## Import patterns

```ts
// E2E tests
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { KudosWallPage } from '../pages/KudosWallPage';

// API tests — MUST use fixtures, not @playwright/test directly
import { test, expect } from '../fixtures';
import { API_BASE_URL, authHeaders } from '../helpers/api';

// Unauthenticated E2E (override the injected storageState)
test.use({ storageState: { cookies: [], origins: [] } });
```

## `LoginPage` — `tests/pages/LoginPage.ts`

Locators (all via `selectors`):
- `container` — `data-testid="sign-in-page"`
- `form` — `data-testid="login-form"`
- `usernameInput` — `data-testid="username-input"`
- `passwordInput` — `data-testid="password-input"`
- `submitBtn` — `data-testid="login-submit"`
- `errorMessage` — `data-testid="login-error"`

Methods: `goto()` navigates to `/` — `login(username, password)` fills and submits

## `KudosWallPage` — `tests/pages/KudosWallPage.ts`

Locators:
- `heading` — `getByRole('heading', { name: 'Kudos Wall' })`
- `createBtn` — `data-testid="create-kudos-btn"`
- `kudosItems` — `data-testid="kudos-item"` (list — use `.first()`, `.count()`, `.nth()`)
- `deleteBtn` — `data-testid="delete-kudos-btn"` (scoped via `getDeleteBtnFor`)
- `modal` — `data-testid="kudos-modal"`
- `messageInput` — scoped to modal: `data-testid="kudos-message-input"`
- `receiverSelect` — scoped to modal: `data-testid="kudos-receiver-select"`
- `submitBtn` — scoped to modal: `data-testid="kudos-submit-btn"`

Modal locators are scoped to `this.modal` — prevents stale element matches when modal is closed.

Methods:
- `goto()` navigates to `/kudos`
- `openModal()` clicks createBtn and waits for modal visible
- `getDeleteBtnFor(item: Locator)` returns the delete button scoped to a specific list item
