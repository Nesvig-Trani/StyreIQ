---
status: implemented
ticket: GIQ-62
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-62
---

# GIQ-62 — ACC-13 Users & Social Media: truncation and indicators

Source of truth: [Linear GIQ-62](https://linear.app/meltstudio/issue/GIQ-62).

## Requirements Summary

- **Feature:** accessibility · **Priority:** P2 · **Category:** Bug
- **Scope:** Users and Social Media surfaces where truncated content relied on native `title` tooltips, and `+X more` indicators were not real interactive controls.
- **Conformance target:** WCAG 2.1 Level AA for new or changed accessibility behavior.
- **Acceptance:** truncated content is reachable without depending on `title` alone; `+X more` is keyboard-activatable with a clear accessible name and reveals the full list.
- **Team rules:** avoid `role="alert"` / `aria-live="assertive"` for routine UI; prefer `role="status"` / `aria-live="polite"` when needed; decorative icons beside visible text use `aria-hidden="true"`; no redundant `aria-hidden` on children of hidden parents; strict heading hierarchy where headings change; scope destructive/state colors to target elements only.

## PRD Alignment

- Linear references `features/accessibility/prd.md`, Component G — Users & Social Media; that path was not present in the repo at planning time.
- Aligns with the same WCAG 2.1 AA accessibility round as other GIQ tickets (see [.plans/giq-60.md](giq-60.md) pattern).

## Files To Modify / Create

- [.plans/giq-62.md](giq-62.md) — this document.
- [src/features/users/hooks/useUserTable.tsx](../src/features/users/hooks/useUserTable.tsx) — email column: accessible disclosure instead of `title` truncation.
- [src/shared/components/ui/info-field.tsx](../src/shared/components/ui/info-field.tsx) — string values wrap without `title` tooltip dependency.
- [src/features/social-medias/components/social-media-details/tabs/overview-tab.tsx](../src/features/social-medias/components/social-media-details/tabs/overview-tab.tsx) — decorative card icons `aria-hidden`.
- [src/features/users/components/details/index.tsx](../src/features/users/components/details/index.tsx) — decorative icons `aria-hidden`.
- [src/features/units/components/unit-cell/index.tsx](../src/features/units/components/unit-cell/index.tsx) — `+N more` as button + popover (not hover-only span/badge).
- [src/features/role-request/hooks/useRoleRequestsTable.tsx](../src/features/role-request/hooks/useRoleRequestsTable.tsx) — justification column: same popover pattern as dense tables (adjacent scope).
- [src/shared/components/truncated-value-popover/index.tsx](../src/shared/components/truncated-value-popover/index.tsx) — shared truncated cell + “View” popover helper.
- Smoke consumers of `UnitCell`: [src/features/flags/hooks/useFlagsTable.tsx](../src/features/flags/hooks/useFlagsTable.tsx), [src/features/review-requests/hooks/useReviewRequestTable.tsx](../src/features/review-requests/hooks/useReviewRequestTable.tsx) — no code changes required beyond shared `UnitCell`.

## Implementation Steps

1. Add this plan under `.plans/giq-62.md`.
2. Implement `TruncatedValuePopover` for dense table cells (popover + button, no `title`-only full value).
3. Update `InfoField` string rendering to `wrap-break-word` + `whitespace-normal`.
4. Replace `UnitCell` hover-card span trigger with `Button` + `Popover` and descriptive `aria-label`.
5. Add `aria-hidden="true"` to decorative icons in Social Media overview and User details cards.
6. Apply popover pattern to role-request justification when long text is truncated.
7. Run `pnpm ci:checks`; complete manual SR/keyboard QA per validation plan.

## Validation Plan

- **Static:** `pnpm lint`, `pnpm type-check`, `pnpm ci:checks`.
- **Users table:** `/dashboard/users` — long emails: use **View** control; keyboard and screen reader can reach full email in popover.
- **User details:** open dialog — long `InfoField` strings wrap without hover `title`.
- **Social Media details:** overview tab — long notes, platform support, manager lists, vendor fields readable via wrapping; icons decorative only.
- **`+N more` units:** announced as button; Enter/Space opens popover; tab order sane in Users, Flags, Review Requests tables.
- **Automated:** axe/Lighthouse on affected views — target zero critical issues.
- **UX:** `/melt-ux-audit` on touched flows when validating the release.

## Open PR / Conflict Review

- Rebase from latest `dev` before merge; watch for concurrent work on shared table or units UI.
- Historical note: PR #136 (`GIQ-61` tree view) was adjacent in units feature but did not overlap `UnitCell` / users email paths directly.

## Edge Cases And Risks

- `InfoField` is shared; wrapping may increase vertical space in dense cards — acceptable trade for AA without hover-only full text.
- `TruncatedValuePopover` uses a character threshold so short values avoid an unnecessary **View** control.
- `UnitCell` popover inside tables must not trap focus incorrectly; Radix `Popover` default behavior should be verified in QA.

## Non-Code Changes

- None (no migrations, env vars, or new dependencies).

## Summary (Implementation)

- Added [TruncatedValuePopover](../src/shared/components/truncated-value-popover/index.tsx) and wired Users email + Role Request justification columns to it.
- Updated [InfoField](../src/shared/components/ui/info-field.tsx) to drop `title`-based truncation for plain strings in favor of wrapping.
- Replaced `UnitCell` hover disclosure with [Button + Popover](../src/features/units/components/unit-cell/index.tsx) and `aria-label` for “Show N more unit(s)”.
- Set `aria-hidden="true"` on decorative icons in [overview-tab.tsx](../src/features/social-medias/components/social-media-details/tabs/overview-tab.tsx) and [User details](../src/features/users/components/details/index.tsx).
- **Verification:** `pnpm ci:checks` — pass.

## Git

- Suggested branch from Linear: `feature/giq-62-acc-13-users-social-media-truncation-and-indicators`.

## Changes

- _2026-05-06:_ Added `.plans/giq-62.md` and recorded implementation summary aligned with Linear GIQ-62.

## Validation Results (Agent)

- **`pnpm ci:checks`** (ESLint + `tsc --noEmit`) — pass (2026-05-06).
- **`pnpm build`** (Next.js production build) — pass (2026-05-06).
- **No `test` script** in `package.json`; manual screen reader / keyboard QA on `/dashboard/users`, social account overview, `/dashboard/role-request`, and a table using **`UnitCell`** (e.g. flags or review requests) remains recommended before merge.

## Validation Results (Developer)

- Reviewed implementation against [Linear GIQ-62](https://linear.app/meltstudio/issue/GIQ-62) and this plan; scope and files match the story. Automated verification re-run: **`pnpm ci:checks`** and **`pnpm build`** pass locally (2026-05-06).
- **Manual accessibility QA** (VoiceOver/NVDA, keyboard-only exercise of **View** popovers and **+N more** button): confirm on preview deploy or localhost before merge if not yet done.

## Review Results (Developer)

- Self-review of the branch diff completed before opening the PR (2026-05-06). **Peer review and approval on GitHub are still required** before merge per team policy (AGENTS.md).
