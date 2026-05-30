---
status: implemented
ticket: GIQ-55
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-55
---

# GIQ-55 — ACC-06 Global Layout: page structure standardization

Source of truth: [Linear GIQ-55](https://linear.app/meltstudio/issue/GIQ-55)

## Requirements summary

- Ensure every in-scope product page exposes exactly one `<h1>` and one `<main>` landmark.
- Focus on SEO and accessibility using **WCAG 2.1 Level AA**.
- Preserve the team ARIA policy: no `role="alert"` / `aria-live="assertive"` for routine feedback; prefer polite/status; decorative icons use `aria-hidden="true"` when visible text names the item.
- Target implementation lives in route layouts and page/feature components (see implementation notes in repo).

## PRD alignment

- Linear references `features/accessibility/prd.md` (Component C — Global Layout). If absent in checkout, Linear remains source of truth.
- Foundational for ACC-03 (skip link) via reliable `#main-content`.

## Current findings (baseline)

- Auth and landing layouts provide `<main id="main-content">`.
- Dashboard uses `SidebarInset` as `<main id="main-content">`; nested page `<main>` was a bug on dashboard home.
- Many routes used `<h2>` or `CardTitle` (`<div>`) as the visible page title; auth forms lacked a semantic `<h1>`.

## Files to modify/create

- `src/app/(dashboard)/dashboard/page.tsx` — remove nested `<main>`, decorative icons on badges.
- `src/app/(dashboard)/dashboard/**/page.tsx` — one `<h1>` per route; fix conditional branches.
- `src/features/social-medias/components/dashboard-social-medias/index.tsx` — page title as `<h1>`.
- `src/features/auth/forms/login-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx` — single page `<h1>` per route.
- Landing/terms — verify one `<main>` and one `<h1>` (mostly already correct).
- Optional: CI a11y check if env allows.

## Implementation steps

1. Landmark ownership: layouts own `<main id="main-content">`; no nested `<main>` in dashboard children.
2. Standardize headings: one `<h1>` per route; `<h2>`+ for sections.
3. Decorative icons in touched UI: `aria-hidden="true"` where text labels the control.
4. Validation: `pnpm lint`, `pnpm type-check`, `pnpm ci:checks`; manual rotor/landmark sweep on route matrix.

## Validation plan

- Static: `pnpm ci:checks`.
- Manual: one `<main>` and one `<h1>` on `/`, `/login`, `/forgot-password`, `/reset-password`, `/dashboard`, key dashboard list pages, `/terms-and-conditions`.
- Skip link: focus lands on `#main-content`.
- `/melt-ux-audit` for touched UI views.

## Edge cases and risks

- Conditional branches (404, empty states) must each expose one `<h1>`.
- CI runtime axe may need auth/DB; defer or scope to public routes if needed.

## Non-code changes

- None expected beyond optional new devDependencies for a11y automation.

## Summary (implementation)

- Removed nested `<main>` on dashboard home (`dashboard/page.tsx`); content wrapper is a `<section aria-label="Dashboard content">`. Super-admin badge icons use `aria-hidden="true"`.
- Promoted dashboard list/overview page titles from `<h2>` to `<h1>` (tenants, users, policies, compliance, flags, audit logs, units, role requests, social medias feature) and adjusted following section headings to `<h2>` where needed.
- Added missing page `<h1>` for review requests, resources, user unit access, auth login/forgot/reset, social accounts logged-out state, units list logged-out state, units create early-return states, and compliance task forms (replaced `CardTitle` with semantic `<h1>`).
- Applied `aria-hidden` to decorative Lucide icons in touched breadcrumbs, badges, buttons, and compliance flows per team guidance.
- **Verification:** `pnpm ci:checks` — pass.

## Open questions

- Sprint folder vs flat `.plans/giq-XX.md` — using `sprint: TBD` to match GIQ-53/54.
