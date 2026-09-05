# AfterCare OS V4 — Architecture

## Product principle
The product is intentionally built around **progressive disclosure**:
- Today shows only what matters now.
- Plan contains the editable operational details.
- Check-in contains the logging flow.
- More contains occasional / premium utilities.

This avoids the “dashboard full of features” problem that makes recovery tools feel like work.

## Technical structure

### 1. Design system
All visual primitives live in `assets/app.css`:
- color tokens
- spacing/radius rules
- buttons
- cards
- navigation
- responsive behavior
- premium gates
- modal sheets
- print view

Changing the brand later does not require rewriting every screen.

### 2. App configuration
`js/config.js`
- schema version
- storage key
- feature flags
- demo entitlement switch

Future integrations can be enabled behind feature flags.

### 3. Storage adapter
`js/storage.js`
The UI does **not** talk directly to localStorage.
It talks to a storage adapter.

Today:
- LocalStorageAdapter

Later this can become:
- IndexedDBAdapter
- SupabaseAdapter
- FirebaseAdapter
- custom API adapter

without rewriting the UI logic.

### 4. Versioned state + migrations
`js/state.js`
- current schema: v4
- migration support from earlier local app versions
- normalized task / medication / check-in structures
- shared selector functions

This is crucial for future updates because existing users do not lose data when the product evolves.

### 5. UI utilities
`js/ui.js`
Small reusable functions for:
- routing
- tabs
- modal sheets
- escaping user-entered content
- formatting
- toast messages

### 6. Feature orchestration
`js/app.js`
Contains the app-level behavior, while data rules remain separated in `state.js`.

## Commercial extensibility

The current demo entitlement:
`state.entitlement = { tier: "preview" | "complete" }`

A future paid version should replace the demo unlock with an entitlement provider, for example:
- Lemon Squeezy license validation
- Stripe + account backend
- Gumroad license validation
- custom one-time purchase service

The rest of the premium UI already reads from one `isComplete()` source.

## Privacy / cloud strategy
V4 stays local-first.

Future cloud sync should be optional:
1. keep local anonymous mode
2. offer account-based sync as an upgrade
3. encrypt / minimize sensitive data
4. do not require a cloud account for basic use unless the business model truly needs it

## UX rules for future features
Every new feature should answer:
1. Does this belong in Today, Plan, Check-in, or More?
2. Can it be hidden until the user actually needs it?
3. Does it reduce mental load rather than create more fields?
4. Can the user understand what happens before they tap?
5. Can we support it without making medical decisions?

If a feature fails those questions, it probably should not be added.
