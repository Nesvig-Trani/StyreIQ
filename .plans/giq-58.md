---
status: implemented
ticket: GIQ-58
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-58
---

# GIQ-58 — ACC-09 Data tables: semantics and actions

Source of truth: [Linear GIQ-58](https://linear.app/meltstudio/issue/GIQ-58).

## Product standards (this round)

- **Conformance target:** WCAG 2.1 Level AA for new or changed accessibility behavior.
- **Table name:** Each targeted `<table>` exposes a programmatic name via **`aria-label`** on the shared **`Table`** primitive (`tableAccessibleName` on **`DataTable`**).
- **Row actions:** Icon-only controls use **`aria-label`** strings that include the **tenant** or **user** display identifier, with **`—`** as the separator (e.g. **`Edit user — Jane Smith`**). Decorative **`Lucide`** icons use **`aria-hidden="true"`** where the control already has an accessible name (no redundant hiding on already-hidden ancestors).
- **Live regions:** No **`role="alert"`** or **`aria-live="assertive"`** added for this story.

## Summary (implementation)

- **`DataTable`:** Optional prop **`tableAccessibleName`** forwarded to **`<table aria-label="…">`** ([`src/shared/components/data-table/table.tsx`](../src/shared/components/data-table/table.tsx)).
- **Tenants:** **`tableAccessibleName="Tenants"`**; actions **`Edit tenant — …`**, **`Governance settings — …`** with **`tenantRowLabel`** fallback **`Tenant #id`** ([`tenants-table.tsx`](../src/features/tenants/components/tenants-table.tsx), [`useTenantsTable.tsx`](../src/features/tenants/hooks/useTenantsTable.tsx)).
- **Users:** **`tableAccessibleName`** is **`Users across tenants`** when **`isViewingAllTenants`**, else **`Users`**; actions **`View user details — …`**, **`Manage user access — …`**, **`Edit user — …`** with **`userRowLabel`** (name → email → **`User #id`**) ([`user-table/index.tsx`](../src/features/users/components/user-table/index.tsx), [`useUserTable.tsx`](../src/features/users/hooks/useUserTable.tsx)).

## Overlap with other PRs

Open PR **#132** (`feature/giq-57-acc-08-dashboard-risk-category-modals`) touches dashboard risk UI and **`dialog.tsx`** — **no shared files** with this ticket; rebase if #132 merges first.

## Validation

- [x] **`pnpm ci:checks`** (lint + **`tsc --noEmit`**) — pass.
- [ ] **Manual:** VoiceOver (or NVDA) on **`/dashboard/tenants`** and **`/dashboard/users`** — table announces the **`aria-label`**; each visible row action includes the entity in its name.
- [ ] **Automated:** axe DevTools / Lighthouse accessibility — no critical issues on those routes (per ticket).

## Open / follow-up

- **`GenerateRollCallButton`** (users table) already names the user in its **`aria-label`**; optional copy alignment to the **`—`** pattern deferred as low priority.
