---
status: approved
ticket: GIQ-65
sprint: prototype
title: ACC-16 — Risk Flags & Audit Log metadata formatting
linear: https://linear.app/meltstudio/issue/GIQ-65
---

## Requirements summary

- Replace raw JSON line rendering in audit log **metadata** with a semantic **definition list** (`<dl>` / `<dt>` / `<dd>`), including nested objects and arrays.
- Give the scrollable metadata region an **accessible name** (`aria-labelledby` + `aria-describedby` for event id) and keep it **keyboard-focusable** (`tabIndex={0}`) with native overflow scroll.
- **WCAG 2.1 AA** bar; no `role="alert"` for this UI; decorative-only icons rule N/A here.
- Fix **heading hierarchy** under the audit details dialog: Radix `DialogTitle` is the primary heading; in-dialog sections use **`h3`** (not `h4`).

## Implementation (done)

| File                                                                                                                                  | Change                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/features/audit-log/components/metadata-info/index.tsx`](../src/features/audit-log/components/metadata-info/index.tsx)           | Client component: recursive `<dl>` / nested `<dl>` for objects, `<ol>` for arrays, scalar branch; `useId` for stable ids; scroll `div` with `role="region"`, `aria-labelledby`, `aria-describedby`, max nesting depth guard. |
| [`src/features/audit-log/components/diff-view/index.tsx`](../src/features/audit-log/components/diff-view/index.tsx)                   | `metadata` clone only when `logMetadata !== undefined`; `metadata != null` gate; pass `auditLogId={log.id}`; `h4` → `h3` for User / Action / Units.                                                                          |
| [`src/features/audit-log/components/change-highlighter/index.tsx`](../src/features/audit-log/components/change-highlighter/index.tsx) | Section titles `h4` → `h3` (only consumer is `DiffView`).                                                                                                                                                                    |

## PR overlap note

Open PR **#138** (GIQ-64) also edits `diff-view/index.tsx`. Rebase or merge-order coordination may be required.

## Validation

- `pnpm ci:checks`
- Manual: Audit Logs → open details on several rows (nested metadata, arrays, scalars).
- Automated: axe / Lighthouse — zero critical a11y issues on the dialog.
- Optional: `/melt-ux-audit` for loading/empty/error consistency.

## Branch (Linear)

`feature/giq-65-acc-16-risk-flags-audit-log-metadata-formatting`
