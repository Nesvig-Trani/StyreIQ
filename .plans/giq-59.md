---
status: implemented
ticket: GIQ-59
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-59
---

# GIQ-59 — ACC-10 Data tables: pagination and comboboxes

Source of truth: [Linear GIQ-59](https://linear.app/meltstudio/issue/GIQ-59).

## Requirements Summary

- **Feature:** accessibility · **Priority:** P2 · **Category:** Bug
- **Conformance target:** WCAG 2.1 Level AA for this round of updates.
- **Scope:** paginated tables — manual QA on **Users** and **Tenants** routes, with reusable fixes in shared **DataTable** primitives.
- **Acceptance:** pagination controls expose meaningful names/state, **Rows per page** combobox announces its selected value, table **search** inputs have meaningful accessible names where that filter is used.
- **Team rules:** decorative icons beside visible text or control labels use `aria-hidden="true"`; do not add `role="alert"` or assertive live regions for this work. See also [GIQ-53](giq-53.md) for live-region policy.

## PRD Alignment

- Aligns with `features/accessibility/prd.md`, Component E — Data Tables.
- Builds on **GIQ-58** (table semantics and row actions); this story focuses on **pagination**, **rows-per-page** exposure, and **search** labeling.

## Open PR / Conflict Review

- Open PR [#133](https://github.com/Nesvig-Trani/StyreIQ/pull/133) (GIQ-58) overlaps `DataTable` + Users/Tenants table files. **GIQ-59** implementation targets shared `pagination.tsx`, `filters/search.tsx`, `toolbar.tsx`, `types.ts`, and optionally `ui/select.tsx` to reduce merge churn. **Rebase onto `dev` after #133 merges** if both land.

## Files To Modify / Create

| Path                                                                                                            | Purpose                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/shared/components/data-table/pagination.tsx`](../src/shared/components/data-table/pagination.tsx)         | Destination-aware `aria-label`s on pagination buttons; rows-per-page trigger name includes selected value; zero-page edge cases; `SelectValue` without incorrect placeholder use. |
| [`src/shared/components/data-table/filters/search.tsx`](../src/shared/components/data-table/filters/search.tsx) | `aria-label` from `label` or `placeholder`; `"use client"`.                                                                                                                       |
| [`src/shared/components/data-table/types.ts`](../src/shared/components/data-table/types.ts)                     | Optional `label` on `DataTableSearchFilter`.                                                                                                                                      |
| [`src/shared/components/data-table/toolbar.tsx`](../src/shared/components/data-table/toolbar.tsx)               | Pass `label` to search filter; `CrossIcon` on Reset `aria-hidden`.                                                                                                                |
| [`src/shared/components/ui/select.tsx`](../src/shared/components/ui/select.tsx)                                 | Chevron on trigger `aria-hidden="true"` (decorative).                                                                                                                             |

Feature tables ([`user-table`](../src/features/users/components/user-table/index.tsx), [`tenants-table`](../src/features/tenants/components/tenants-table.tsx]): avoid unless needed for copy or after GIQ-58 rebase.

## Implementation Steps

1. Rebase or update after PR **#133** lands, or keep GIQ-59 scoped to shared files until then.
2. **`DataTablePagination`:** derive `pageCount`, `currentPage`, handle **zero pages** (“No pages”, safe button labels).
3. **Pagination `aria-label`s:** destination-aware first / previous / next / last; when disabled at ends, clarify “already on first/last page”.
4. **Rows per page:** `SelectTrigger` `aria-label` including current value (e.g. `Rows per page, 10 rows selected`); `<SelectValue />` without numeric `placeholder` misuse.
5. **Decorative icons:** pagination Lucide icons, select chevron, reset icon — `aria-hidden` where redundant with text/`aria-label`.
6. **`DataTableSearchFilter`:** default `aria-label` from `placeholder`; allow explicit `label` in filter defs.
7. Run **`pnpm ci:checks`** before merge.

## Validation Plan

- **Static:** `pnpm lint`, `pnpm type-check`, `pnpm ci:checks`.
- **Manual — `/dashboard/users`:** rows-per-page combobox and pagination buttons announce action + page context; tenant filter if “all tenants” view.
- **Manual — `/dashboard/tenants`:** same for pagination and rows-per-page.
- **Search:** validate on any route that registers a **`type: 'search'`** global filter; Users/Tenants may not expose search today — document the route used for QA.
- **Automated:** axe / Lighthouse on Users and Tenants — no critical issues in pagination/combobox/search areas.
- **UX:** optional `/melt-ux-audit` for loading/empty/error and URL state.

## Edge Cases And Risks

- **#133** overlap — rebase when GIQ-58 merges.
- Radix **Select** empty value span — mitigated by trigger `aria-label` + correct `SelectValue` usage.
- **`pageCount === 0`** — avoid `page 1 of 0`; use “No pages” and disabled-safe button copy.

## Non-Code Changes

- No migrations, env vars, or new dependencies.

## Summary (implementation)

- **`pagination.tsx`:** Destination-aware labels; removed duplicate sr-only spans in favor of `aria-label`; rows-per-page `aria-label` includes selected **`pageSize`**; visible page indicator shows “No pages” when `pageCount === 0`.
- **`search.tsx` / `types.ts` / `toolbar.tsx`:** Optional **`label`** on search filter type; **`aria-label`** defaults from placeholder; Reset icon **`aria-hidden`**.
- **`select.tsx`:** Trigger chevron **`aria-hidden="true"`**.

Coordinate with **GIQ-58** / PR **#133** before merging if both touch the same feature branches.

## Validation Results (Agent)

- **`pnpm ci:checks`** (ESLint + `tsc --noEmit`) — pass (2026-05-06).
- **No unit test script** in this repo; manual screen-reader QA on Users/Tenants routes is still recommended before merge.

## Validation Results (Developer)

- Pending — please complete manual QA per **Validation Plan** (`/dashboard/users`, `/dashboard/tenants`, optional axe/Lighthouse) and record outcome here before merge.

## Review Results (Developer)

- Pending — human code review required per team policy before merge.
