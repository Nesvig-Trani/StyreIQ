---
status: approved
ticket: GIQ-64
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-64
---

# GIQ-64 — ACC-15 Risk Flags & Audit Log: action buttons and date pickers

Source of truth: [Linear GIQ-64](https://linear.app/meltstudio/issue/GIQ-64).

## Summary

- Row-scoped accessible names for Risk Flags actions (details, history, comments, resolve) and Audit Log details trigger.
- Distinct `aria-label` per data-table date-range filter via `filterLabel` / filter `title`.
- Meaningful empty-state copy for Risk Flag Type and Affected Record columns.
- Decorative icons: `aria-hidden="true"` where adjacent text provides the name; no assertive live regions.

## Open PR overlap

- PR #137 (GIQ-62), #136 (GIQ-61): no file overlap with this story.
- PR #64: `package.json` only — avoid dependency changes.

## Implementation record

- See git history / PR for file-level changes and validation (`pnpm ci:checks`).
