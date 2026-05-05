---
status: implemented
ticket: GIQ-53
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-53
supersedes_giq_51: live-region-policy
---

# GIQ-53 — Polite live regions and ARIA policy

## Summary

Replaced **`role="alert"`** with **`role="status"`** **`aria-live="polite"`** for routine auth/account errors (login failure toast, forgot-password `submitError`, reset-password `apiError`, create-first-user `toast.error` spans).

**Exception:** **Account lockout** after too many failed attempts remains **`role="alert"`** (time-sensitive security state that blocks sign-in).

## Files changed

- [`src/features/auth/hooks/useLogin.tsx`](../src/features/auth/hooks/useLogin.tsx) — generic sign-in toast: `status` + `polite`; locked-account toast: unchanged `alert`.
- [`src/features/auth/forms/forgot-password-form.tsx`](../src/features/auth/forms/forgot-password-form.tsx) — `submitError`: `status` + `polite`.
- [`src/features/auth/forms/reset-password-form.tsx`](../src/features/auth/forms/reset-password-form.tsx) — `apiError`: `status` + `polite`.
- [`src/features/users/hooks/useCreateFirstUserForm.ts`](../src/features/users/hooks/useCreateFirstUserForm.ts) — error toast payloads: `status` + `polite`.

## Verification

- `pnpm ci:checks` — pass after changes.
- **Manual:** VoiceOver/NVDA on `/login`, `/forgot-password`, `/reset-password`, `/login/create-first-user`: confirm polite paths do not interrupt aggressively; locked-account toast still announces assertively.

## Relation to GIQ-51

GIQ-51 added **`role="alert"`** for immediate announcements; GIQ-53 narrows **`alert`** to the lockout case and uses **polite `status`** elsewhere per product ARIA guidelines.
