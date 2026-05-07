---
status: implemented
ticket: GIQ-71
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-71
git_branch: feature/giq-71-acc-22-dashboard-stat-cards-numbers-misread-by-voiceover-on
---

# GIQ-71 — ACC-22 Dashboard: stat cards numbers misread by VoiceOver on mobile

Source of truth: [Linear GIQ-71](https://linear.app/meltstudio/issue/GIQ-71).

## Summary

VoiceOver on iOS was merging adjacent numeric text in the same `<dd>` (e.g. `160` + `44 completed` → `16044 completed`). Fix: keep the existing `<dl>/<dt>/<dd>` structure from [GIQ-56](giq-56.md), add a single explicit `aria-label` on each value `<dd>` that joins parts with commas, and set `aria-hidden="true"` on the visual child nodes inside that `<dd>` so assistive tech reads the label instead of concatenating spans.

## Files

| File                                                                                                                      | Change                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [`src/features/dashboard/components/header-metric-card.tsx`](../src/features/dashboard/components/header-metric-card.tsx) | `aria-label={`${value}, ${subtitle}`}` on `<dd>`; value and subtitle spans `aria-hidden`                    |
| [`src/features/dashboard/components/status-card.tsx`](../src/features/dashboard/components/status-card.tsx)               | Same pattern for account status metrics                                                                     |
| [`src/features/dashboard/components/risk-category-card.tsx`](../src/features/dashboard/components/risk-category-card.tsx) | `aria-label={`${subtitle}, ${issues} ${issueWord}`}` on `<dd>`; interactive `button` `aria-label` unchanged |
| [`src/features/dashboard/components/metric-card.tsx`](../src/features/dashboard/components/metric-card.tsx)               | Same VoiceOver behavior as above; implementation refactored (see below).                                    |

Consumers [`dashboard/page.tsx`](<../src/app/(dashboard)/dashboard/page.tsx>), [`aggregate-metrics.tsx`](../src/features/dashboard/components/aggregate-metrics.tsx), and [`central-admin-dashboard.tsx`](../src/features/dashboard/components/central-admin-dashboard.tsx) require no copy changes for this fix.

### `metric-card.tsx` refactor (post-accessibility fix)

- **`RiskLevel`** — shared type for `riskLevel` prop and helpers.
- **`RISK_BADGE_LABELS`** — single map for High/Medium badge copy (no nested ternary); `low` has no badge label, matching prior behavior.
- **`getMetricAriaLabel`** — builds `dd` `aria-label` from `[value, subtitle, riskBadgeText]`, filters empties, joins with commas only when there is more than one part (unchanged semantics for screen readers).
- **Badge** — renders `riskBadgeText` from the map; shown when `riskLevel && riskBadgeText` (medium/high only).

## Validation

### Automated

- [x] `pnpm ci:checks` — pass (lint + `tsc --noEmit`)

### Manual (required before closing Linear)

- [ ] VoiceOver on iOS — `/dashboard`: Total Compliance Tasks (super-admin all-tenants), Compliance Rate (central admin), summary `HeaderMetricCard`s, `StatusCard`s, `RiskCategoryCard`s — confirm values are not merged into a single number; expect e.g. `160, 44 completed`
- [ ] `/melt-ux-audit` scoped to `/dashboard` when the team runs the accessibility pass

## Related

- [GIQ-56](giq-56.md) — dashboard metric `<dl>` semantics
