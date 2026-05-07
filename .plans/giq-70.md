---
status: implemented
ticket: GIQ-70
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-70
---

# GIQ-70 — ACC-21 Sidebar: redundant Dashboard link

Source of truth: [Linear GIQ-70](https://linear.app/meltstudio/issue/GIQ-70).

## Requirements summary

- Remove duplicate `/dashboard` from the sidebar accessible navigation: screen readers and no-CSS users should see one link to `/dashboard` (the Dashboard nav item), not the brand plus nav item.
- WCAG 2.1 Level AA. Decorative icons beside visible text: `aria-hidden="true"`.

## Implementation

| File                                                                                            | Change                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/shared/components/app-sidebar/index.tsx`](../src/shared/components/app-sidebar/index.tsx) | Header brand: replaced `Link href="/dashboard"` with non-focusable `div` + same layout/typography. Lucide icons: explicit `aria-hidden="true"`. |

## Validation

- **Static:** `pnpm ci:checks` — pass (2026-05-07).
- **Manual:** Confirm sidebar DOM has a single `<a href="/dashboard">` (from primary nav). Tab order: brand text not in tab sequence; Dashboard link reachable once.
