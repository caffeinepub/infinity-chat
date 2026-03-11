# Infinity Chat

## Current State
The app requires Internet Identity (II) login before accessing any chat. After login, users set a display name profile, then see a group chat. Groups are publicly discoverable (via Discover Groups section) but require II sign-in, which prevents friends from easily joining the same chat.

Timestamps are currently shown below each message bubble.

## Requested Changes (Diff)

### Add
- Ed25519KeyIdentity-based guest identity system: generate a random keypair per device, store in localStorage (`infinity_chat_identity`). No Internet Identity needed.
- Simple entry screen: just a display name input (no II popup, no browser wallet). User enters a name, clicks Join, and enters the chat.

### Modify
- `useInternetIdentity.ts`: Replace II auth flow with Ed25519KeyIdentity from localStorage. `login()` generates a new keypair and stores it. `clear()` removes it. Identity is loaded from localStorage on init.
- `LandingPage.tsx`: Replace II login button with a username input + "Join Chat" button. On submit, store display name to localStorage as `infinity_chat_display_name`, then call `login()` to create the guest identity.
- `App.tsx`: After identity exists but profile is null, auto-save the profile using the display name stored in localStorage (instead of showing ProfileSetup screen). This removes the two-step onboarding.
- `MessageBubble.tsx`: Remove the timestamp `<span>` entirely. Timestamps should never be shown.
- `GroupSidebar.tsx`: When user enters chat for the first time, auto-join any existing groups so they land inside a group immediately rather than seeing an empty sidebar.

### Remove
- The `ProfileSetup.tsx` screen from the active flow (it can remain in code but won't be shown; profile is auto-created from localStorage display name).
- All timestamp rendering from message bubbles.

## Implementation Plan
1. Modify `useInternetIdentity.ts`: use `Ed25519KeyIdentity` from `@dfinity/identity`. On init, try `Ed25519KeyIdentity.fromJSON(localStorage.getItem('infinity_chat_identity'))`. `login()` calls `Ed25519KeyIdentity.generate()`, stores via `identity.toJSON()`, sets state. `clear()` removes from localStorage.
2. Modify `LandingPage.tsx`: username input form. On submit, set `localStorage.setItem('infinity_chat_display_name', name)`, then call `login()`.
3. Modify `App.tsx`: When `isAuthenticated && !isLoading && isFetched && userProfile === null`, auto-call `saveProfile({ displayName: localStorage.getItem('infinity_chat_display_name') || 'Anonymous', lastActive: BigInt(Date.now()) * 1_000_000n })` instead of showing ProfileSetup.
4. Modify `MessageBubble.tsx`: Delete the timestamp `<span>` at the bottom of the bubble.
5. Modify `GroupSidebar.tsx` / `ChatLayout.tsx`: On first load when `allGroups` is available and user has no groups, auto-join the first available group and select it.
