---
status: implemented
ticket: GIQ-78
sprint: cycle-23-accessibility-2
acc: ACC-29
linear_url: https://linear.app/meltstudio/issue/GIQ-78
standard: WCAG 2.1 Level AA
---

# GIQ-78 — ACC-29 Units: search input accessible name

Source of truth: [Linear GIQ-78](https://linear.app/meltstudio/issue/GIQ-78).

## Summary

The Units page search control in [`src/shared/components/organization-hierarchy/index.tsx`](../../src/shared/components/organization-hierarchy/index.tsx) meets ACC-29:

- **`aria-label="Search units by name"`** — persistent accessible name independent of placeholder.
- **`type="search"`** — matches the RFC / ticket HTML example (`Name, Role, Value`).

[`Input`](../../src/shared/components/ui/input.tsx) spreads `...props` onto `<input>`, so both attributes reach the DOM.

Originally aligned with **GIQ-61** Units tree accessibility; this ticket closes the RFC coverage gap vs ACC-01–ACC-17.

## Wiring

- [`src/app/(dashboard)/dashboard/units/page.tsx`](<../../src/app/(dashboard)/dashboard/units/page.tsx>) renders `UnitHierarchy` from `@/shared/components/organization-hierarchy`.

## Verification

| Check                                                          | Result                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Static: `aria-label` + `type="search"` on Units search `Input` | Pass — [`organization-hierarchy/index.tsx`](../../src/shared/components/organization-hierarchy/index.tsx) |
| `Input` forwards ARIA/type to DOM                              | Pass — [`input.tsx`](../../src/shared/components/ui/input.tsx)                                            |
| `pnpm ci:checks`                                               | Pass — latest local run                                                                                   |

| Check                                                                        | Result                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| Browser: DevTools / a11y tree — computed name **Search units by name**       | **Manual** — run on `/dashboard/units` while logged in |
| Browser: after typing — name unchanged, filter still works                   | **Manual**                                             |
| Adjacent filters (`Filter by status`, `Filter by type`, tenant when visible) | **Manual** — spot-check                                |
| `/melt-ux-audit` on Units                                                    | **Manual** — team workflow                             |

## Linear / Melt Central

- Post closeout summary to **GIQ-78** after review (Linear MCP comment may fail in some environments — paste this section if needed).
- `meltctl plan submit` was used successfully in an earlier session; re-run after edits if required by team practice.

## Edge cases / notes

- Branches/deploys missing GIQ-61 hierarchy work must cherry-pick the same `organization-hierarchy` search semantics.
