# Frontend Behaviour

## KudosWallPage (`src/pages/KudosWallPage.tsx`)

- Fetches `GET /kudos` on mount via `apiClient.get('/kudos')`
- Stores result in Zustand `useKudosStore` — UI reads from store, not directly from API
- New kudos are **prepended** to the store with `prependKudo()` — appear at top immediately without page reload
- Deleted kudos are removed from the store with `removeKudo(id)` — disappear immediately without page reload
- Delete button only visible when `user.id === kudo.authorId`
- Loading state renders "Loading…" text
- Empty state renders "No kudos yet — be the first to give one!"

## KudosModal (`src/components/KudosModal.tsx`)

- Fetches `GET /auth/users` on mount, filters out current user (`u.id !== currentUser?.id`)
- Receiver dropdown is pre-selected to the first user in the filtered list
- Client-side validation: empty message shows "Message is required." error before API call
- On successful submit: calls `prependKudo(kudo)` then `onClose()` — modal closes, kudo appears at top
- On API error: shows error from `response.data.message` or fallback "Failed to submit kudo. Please try again."
- Backdrop click closes modal (click handler on the overlay div)
- Inner panel has `e.stopPropagation()` — clicking inside does not close
