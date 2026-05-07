---
status: validated
ticket: GIQ-66
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-66
---

# GIQ-66 — ACC-17 Role Requests & Training: approvals and info boxes

Source of truth: [Linear GIQ-66](https://linear.app/meltstudio/issue/GIQ-66).

## Requirements Summary

- **Feature:** accessibility · **Priority:** P1 · **Category:** Bug
- **Scope:** Role Requests table Approve/Reject actions share generic names across rows; Training Resources page note callout lacked semantic role.
- **Conformance target:** WCAG 2.1 Level AA for new or changed accessibility behavior.
- **Acceptance:** each Approve/Reject exposes requester name and requested role in its accessible name; Training Resources supplementary note uses meaningful semantics without `role="alert"` / assertive live regions.
- **Team rules:** avoid `role="alert"` / `aria-live="assertive"` for routine UI; decorative icons beside visible button text use `aria-hidden="true"`; no redundant `aria-hidden` on children of hidden parents; strict heading hierarchy; scope state colors to target elements only.

## PRD Alignment

- Linear references `features/accessibility/prd.md`, Component I — Role Requests & Training.
- Aligns with the WCAG 2.1 AA accessibility round as sibling GIQ tickets (e.g. [.plans/giq-62.md](giq-62.md)).

## Files To Modify / Create

- [.plans/giq-66.md](giq-66.md) — this document.
- [src/features/role-request/hooks/useRoleRequestsTable.tsx](../src/features/role-request/hooks/useRoleRequestsTable.tsx) — per-row `aria-label` on Approve/Reject; `aria-hidden` on icons; `aria-busy` while request in flight.
- [src/app/(dashboard)/dashboard/resources/page.tsx](<../src/app/(dashboard)/dashboard/resources/page.tsx>) — `role="note"` + `aria-labelledby` on blue informational callout.

## Implementation Steps

1. Add `.plans/giq-66.md`.
2. In `useRoleRequestsTable` actions column, compute display name and role label from row data; set distinct `aria-label` strings; mark icons decorative; optional `aria-busy` when loading.
3. On Training Resources page, give the note block `role="note"` and tie it to visible “Note” label via `aria-labelledby`.
4. Run `pnpm ci:checks`; manual SR/keyboard QA per validation plan.

## Validation Plan

- **Static:** `pnpm lint`, `pnpm type-check`, `pnpm ci:checks`.
- **Role requests:** `/dashboard/role-request` — multiple pending rows; VoiceOver/NVDA announces unique names per Approve/Reject; loading state does not duplicate confusing output.
- **Training Resources:** `/dashboard/resources` — note region exposes note semantics (not generic group only).
- **Automated:** axe/Lighthouse on affected routes — target zero critical issues.

## Open PR / Conflict Review

- Open PRs #138–#140 (GIQ-64/63/65) did not touch `useRoleRequestsTable.tsx` or `resources/page.tsx` at implementation time; rebase from latest `dev` before merge and re-check if parallel branches edit the same files.

## Edge Cases And Risks

- If `user` is not populated as an object, fall back to `'Unknown'` for the accessible name (matches User column).
- `role="note"` is supplementary context only — appropriate vs alert for this copy.

## Non-Code Changes

- None (no migrations, env vars, or new dependencies).

## Summary (Implementation)

- [useRoleRequestsTable.tsx](../src/features/role-request/hooks/useRoleRequestsTable.tsx): row-specific `aria-label` for Approve/Reject; `aria-hidden="true"` on `CheckCircle` / `XCircle`; `aria-busy` while row action loads.
- [resources/page.tsx](<../src/app/(dashboard)/dashboard/resources/page.tsx>): note callout wrapped with `role="note"` and `aria-labelledby` referencing visible **Note** heading id.

## Git

- Suggested branch from Linear: `feature/giq-66-acc-17-role-requests-training-approvals-and-info-boxes`.

## Changes

- _2026-05-07:_ Implemented GIQ-66 per plan; added `.plans/giq-66.md`.

## Validation Results (Agent)

- [x] `pnpm lint` — pass (2026-05-07): no ESLint warnings or errors.
- [x] `pnpm type-check` — pass (2026-05-07): `tsc --noEmit` completed successfully.
- [x] `pnpm ci:checks` — pass (2026-05-07): combined ESLint + TypeScript checks completed successfully.
- [x] Role request button markup — verified by source inspection: Approve/Reject buttons include row-specific `aria-label` values with requester name and requested role; action icons are `aria-hidden="true"`; loading buttons expose `aria-busy`.
- [x] Training Resources note markup — verified by source inspection: blue note callout uses `role="note"` and `aria-labelledby="training-resources-note-heading"`; no `role="alert"` or `aria-live="assertive"` was introduced.
- [ ] Browser screen reader QA on `/dashboard/role-request` — SKIPPED (Chrome DevTools MCP was configured in `.mcp.json` but not exposed in this session; developer chose to proceed without browser checks).
- [ ] Browser screen reader QA on `/dashboard/resources` — SKIPPED (Chrome DevTools MCP unavailable in this session; manual validation required).
- [ ] Automated axe/Lighthouse scan on affected routes — SKIPPED (browser validation tooling unavailable in this session; manual or preview validation required).

## Test Coverage Gaps

- Role request action accessible names are not covered by automated tests. Recommended future test: a component/table render test for `useRoleRequestsTable` actions asserting Approve/Reject accessible names include requester name and role label.
- Training Resources note semantics are not covered by automated tests. Recommended future test: a page/component render test asserting the callout has `role="note"` and is labelled by the visible **Note:** text.
- No tests added in this validation pass because the repo has no configured test script or existing test files, and the developer chose to record the gaps for later.

## Validation Results (Developer)

- Developer confirmed manual validation is complete via chat (2026-05-07).
- Approved: yes.

## Review Results (Developer)

- Developer confirmed review is complete and requested PR creation via chat (2026-05-07).
- Peer review and approval on GitHub are still required before merge per team policy.
