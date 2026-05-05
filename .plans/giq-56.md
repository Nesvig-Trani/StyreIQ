---
status: implemented
ticket: GIQ-56
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-56
---

# GIQ-56 — ACC-07 Dashboard: data and metric associations

Source of truth: [Linear GIQ-56](https://linear.app/meltstudio/issue/GIQ-56) (Melt Studio workspace).

## Product standards (this round)

- **Conformance target:** WCAG 2.1 Level AA for new or changed accessibility behavior.
- **Decorative icons:** Icons beside visible text that already names the metric or category use **`aria-hidden="true"`** (including the decorative icon wrappers where applicable).
- **Live regions:** This story did not introduce **`role="alert"`** or **`aria-live="assertive"`**; routine metric UI stays out of assertive announcements per team policy ([GIQ-53](giq-53.md)).

## Summary (implementation)

Commit: `30183cde34123c3e54dad7990be6be7f1b989876`  
Conventional commit: `refactor: enhance accessibility and semantic structure in dashboard component cards`

Dashboard metrics are expressed with **definition list** semantics (**`<dl>` / `<dt>` / `<dd>`**) so Assistive Technologies can relate each **metric label** to its **value** (and supporting subtitle where present) instead of unrelated generic text nodes.

- **Header aggregate-style metrics** (`HeaderMetricCard`): replaced three generic `<p>` elements with a `<dl>` — `<dt>` (title) + `<dd>` (value + subtitle as `<span>` children). Icon container and Lucide icon both gain `aria-hidden="true"`.
- **Account status tiles** (`StatusCard`): the card previously used a `<h3>` for the label — replaced with `<dt>` inside `<dl>`; value and subtitle become `<span>` children of `<dd>`. Icon container + icon `aria-hidden="true"`. Intentional: removing a `<h3>` in favour of `<dt>` is correct here because these tiles are metric items, not page/section headings.
- **Risk category tiles** (`RiskCategoryCard`): the card previously used a `<h3>` for the category name and a `<p>` for the subtitle — replaced with `<dl>/<dt>/<dd>`; issue count and issue label are grouped in the same `<dd>` as the subtitle so reading order is cohesive. Category icon wrapper + icon `aria-hidden="true"`; severity-indicator dots `aria-hidden="true"`. Also: `React.FC<…>` → `FC<…>` with `import type { FC } from 'react'`; `flex-shrink-0` → `shrink-0` on severity dots (Tailwind shorthand). Intentional heading removal: same reasoning as `StatusCard`.
- **Generic MetricCard:** removed `CardHeader` + `CardTitle` imports (unused after refactor). Single `CardContent` now holds the full `<dl>` — `<dt>` (title) on the header row alongside the decorative icon; `<dd>` groups value, optional subtitle, and optional risk `Badge`. Trailing risk badge wrapped in `<span>` to keep valid flow inside `<dd>`.

[`aggregate-metrics.tsx`](../src/features/dashboard/components/aggregate-metrics.tsx) and [`central-admin-dashboard.tsx`](../src/features/dashboard/components/central-admin-dashboard.tsx) required **no** API or copy changes (`HeaderMetricCard` props unchanged).

**Coordination:** GIQ-55 / PR #130 work (page **`main`/`h1`**, unrelated dashboard shell) stays separate; metric semantics live in **`src/features/dashboard/components/*`**.

## Plan completion status

| Requirement (Linear + this plan)                                                                                                                        | Status                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Relate dashboard metric labels to values via semantic HTML (`<dl>/<dt>/<dd>`)                                                                           | **Done** in `HeaderMetricCard`, `StatusCard`, `RiskCategoryCard`, `MetricCard`.             |
| Visual layout unaffected (same Tailwind grouping; no copy churn beyond structure)                                                                       | **Done** — structure-only refactors preserved classes and props.                            |
| Decorative icons beside labeled metrics `aria-hidden="true"`                                                                                            | **Done** on metric/category card icons (+ severity dots in risk list rows).                 |
| No assertive live regions introduced                                                                                                                    | **Done** — no `role="alert"` / `aria-live="assertive"` in this scope ([GIQ-53](giq-53.md)). |
| Consumers (`dashboard/page.tsx`, `aggregate-metrics.tsx`, `central-admin-dashboard.tsx`, `dashboard-client-wrapper` → `RiskCategoryCard`) unchanged API | **Verified** — only shared components edited.                                               |
| `MetricCard` aligned for consistency (no current callers)                                                                                               | **Done** — available for reuse with same semantics.                                         |
| **`RiskCategoryCard`** pointer-only **`onClick` on `<div>`** — keyboard/button role                                                                     | Documented **follow-up** (out of scope for GIQ-56 per Linear).                              |
| Manual QA — SR, axe, `/melt-ux-audit`                                                                                                                   | **Outstanding** — human sign-off before closing the Linear issue.                           |

**Code / automation:** Re-validated `pnpm ci:checks` on **2026-05-05** — pass.

## Files touched (GIQ-56)

| File                                                                                                                      | Role                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/features/dashboard/components/header-metric-card.tsx`](../src/features/dashboard/components/header-metric-card.tsx) | **`dl`** label + **`dd`** (value + subtitle); icon decorative.                                                                                                |
| [`src/features/dashboard/components/status-card.tsx`](../src/features/dashboard/components/status-card.tsx)               | Replaced `<h3>` + `<p>` with **`dl`/`dt`/`dd`**; decorative leading icon (container + icon).                                                                  |
| [`src/features/dashboard/components/risk-category-card.tsx`](../src/features/dashboard/components/risk-category-card.tsx) | Replaced `<h3>` + `<p>` with **`dl`/`dt`/`dd`**; issue count + word grouped in same `<dd>`; decorative icon + severity dots. `React.FC` → `FC`.               |
| [`src/features/dashboard/components/metric-card.tsx`](../src/features/dashboard/components/metric-card.tsx)               | Removed `CardHeader`/`CardTitle`. **`dl`** in **`CardContent`**; **`dd`** groups value, optional subtitle, optional risk **`Badge`**; decorative header icon. |

## Verification

### Automated (completed)

- `pnpm lint` — pass
- `pnpm type-check` — pass
- `pnpm ci:checks` — pass (same as lint + `tsc`; see table below)

### Manual (recommended before close)

- **DOM / visual:** `/dashboard` — super-admin all-tenants view, tenant-scoped metrics, header row, risk category grid, account status overview; confirm layout matches pre-change snapshots.
- **Screen reader:** VoiceOver and/or NVDA — rotor / linear read confirms label + value (and subtitles) associate as intended.
- **Axe:** zero critical issues on `/dashboard` metric regions.
- **UX completeness:** `/melt-ux-audit` when the team runs the dashboard pass.

### Validation record

| Check             | Result | Last verified |
| ----------------- | ------ | ------------- |
| `pnpm lint`       | Pass   | 2026-05-05    |
| `pnpm type-check` | Pass   | 2026-05-05    |
| `pnpm ci:checks`  | Pass   | 2026-05-05    |

## Follow-up

- **`RiskCategoryCard`** remains **`onClick` on a `<div>`** (pointer-only activation). Keyboard / button semantics are **out of scope** for GIQ-56 per ticket; track as a separate interaction story if QA flags it.

## Related plans

- **GIQ-55** (ACC-06 global layout / page structure): may land via open PR work; not yet present as `.plans/giq-55.md` in this checkout.
- [GIQ-53](giq-53.md) — polite live-region policy.
