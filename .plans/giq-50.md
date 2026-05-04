---
status: pending-review
ticket: GIQ-50
sprint: TBD
standard: WCAG 2.1 Level AA
implementation_commit: d0ef4607de9a29377b4f6894f1f5beb98530fa14
linear_url: https://linear.app/meltstudio/issue/GIQ-50
---

# GIQ-50 — ACC-01 Landing & Login: form and dialog accessibility

## Requirements summary

From [Linear GIQ-50](https://linear.app/meltstudio/issue/GIQ-50):

- **Objective:** Users signing in with assistive technology (and password managers) get correct field semantics, modal behavior, and recoverable error messaging on the landing/login-related routes.
- **Scope (routes):** `/login`, `/forgot-password`, `/reset-password`, `/login/create-first-user`.
- **Design intent:**
  - Appropriate HTML `autocomplete` on email/password fields (`email`, `current-password`, `new-password` where applicable).
  - Dialog roots used in the flow expose `aria-modal="true"`; focus trap should stay consistent with Radix behavior.
  - Invalid-credentials feedback must not be a silent/generic toast; it should include resolution guidance (e.g. link to forgot password) without revealing whether email or password failed.
- **Acceptance (functional):** Screen reader users hear labels + autocomplete roles; password managers can offer credentials; dialogs announce as modals with focus trapped; failed login errors are announced and include recovery guidance.
- **Verification (from ticket):** Manual SR pass (NVDA / VoiceOver), password manager check (e.g. 1Password), automated axe pass with zero **critical** issues on the login surface.

**Accessibility standard for this round:** All new or changed behaviors should be judged against **WCAG 2.1 Level AA** (including related understanding for name/role/value, labels, status messages, and focus order).

## PRD alignment

Implements **Component A — Landing & Login** from PRD `features/accessibility/prd.md` (referenced in Linear). Fits the broader accessibility uplift (PoC → Prototype).

## Implementation status (mapped to `d0ef4607`)

| Requirement                                    | Status                        | Notes                                                                                                                                  |
| ---------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `autocomplete` on login email/password         | Done                          | `login-form.tsx`: `email`, `current-password`                                                                                          |
| `autocomplete` on forgot-password email        | Done                          | `forgot-password-form.tsx`: `email`                                                                                                    |
| `autocomplete` on reset password fields        | Done                          | `reset-password-form.tsx`: `new-password` on both fields                                                                               |
| `autocomplete` on create-first-user            | Done                          | `useCreateFirstUserForm.ts` + `FieldData.autoComplete` wired through `text.tsx` / `password.tsx`                                       |
| `aria-modal="true"` on dialogs                 | Done                          | `dialog.tsx` → `DialogPrimitive.Content` (applies to all consumers of shared `Dialog`)                                                 |
| Clear invalid-credentials copy + recovery link | Done                          | `useLogin.tsx` → `toast.custom` with heading, explanatory text, link to `/forgot-password` (matches “don’t reveal which field failed”) |
| Locked-account path                            | Unchanged from prior behavior | Still uses `toast.custom` with copy + link — re-validate with SR                                                                       |

**Files touched in commit:** `login-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `useLogin.tsx`, `useCreateFirstUserForm.ts`, `form-hook-helper/fields/text.tsx`, `form-hook-helper/fields/password.tsx`, `form-hook-helper/types.ts`, `dialog.tsx`.

## Files to modify/create (for follow-up, if validation finds gaps)

- `src/features/auth/hooks/useLogin.tsx` — only if toast semantics need `role="alert"` / `aria-live` refinement for WCAG 4.1.3 (Status Messages) after testing.
- `src/shared/components/ui/sonner.tsx` — only if global Toaster region needs explicit `toastOptions` or props for announcements (confirm against Sonner + SR behavior first).

## Implementation steps (completed in branch / commit above)

1. Add `autoComplete` to controlled login and auth-related forms (login, forgot, reset, first-user field config).
2. Extend `FieldData` with optional `autoComplete` and pass through shared form helpers.
3. Set `aria-modal="true"` on shared dialog content (Radix Dialog).
4. Replace generic invalid-credentials toast with rich custom content including recovery link.

## Validation plan (run after your review, before merge)

**Automated**

1. `pnpm ci:checks` (lint + typecheck) on the branch containing `d0ef4607`.
2. **axe** (browser extension or CI if configured): open `/login`, `/forgot-password`, `/reset-password`, `/login/create-first-user`; confirm **no critical** violations on those pages (per ticket). For AA, also note serious issues and fix or ticket separately.

**Manual — WCAG 2.1 AA lens**

3. **Keyboard & focus (2.1.1, 2.4.3, 2.4.7):** Tab through each form; focus order logical; focus visible; dialog open/close returns focus appropriately.
4. **Labels & names (1.3.1, 4.1.2):** Each control has associated label; email/password fields expose correct accessible name and `autocomplete` in devtools/inspector.
5. **Password managers:** With 1Password (or equivalent), confirm save/fill prompts align with `autocomplete` on `/login` and related routes.
6. **Screen readers:** VoiceOver (macOS) and/or NVDA (Windows): tab into fields — hear label + field type; submit invalid credentials — hear error **content** (not silent); open any dialog in login flow — hear modal behavior; confirm focus trapped until dismiss (Radix default).
7. **Status messages (4.1.3 AA):** After failed login, verify the toast region is exposed as a live region (Sonner typically does; confirm with SR “read all” / announcements). If announcements are unreliable, add explicit live region / `role="alert"` on the custom toast wrapper in a follow-up commit.
8. **Non-text contrast (1.4.3):** Check error toast text/link contrast against background (red palette) meets 4.5:1 for normal text.

**UX audit (optional but recommended for UI work)**

9. Run `/melt-ux-audit` for loading/empty/error states and navigation on the affected routes.

## Edge cases and risks

- **Global `Dialog` change:** `aria-modal="true"` on shared `DialogContent` affects every dialog in the app — generally correct for Radix Dialog; regression-test a few non-auth dialogs for SR + focus.
- **Toast vs SR:** Custom `toast.custom` JSX may need explicit ARIA if Sonner’s wrapper doesn’t announce reliably in your target browsers.
- **Both password fields `new-password` on reset:** Matches HTML guidance for “choose new password” flows; confirm password managers still behave as expected.

## Non-code changes

- None required for this story (no new env vars or migrations).

## Open questions

1. **Sprint folder:** This file lives at `.plans/giq-50.md` (slug from issue id). If the team standardizes on `.plans/<sprint>/GIQ-50.md`, move/rename when sprint id is confirmed.
2. **axe scope:** Ticket says “login surface” — confirm whether that means **only** `/login` for the zero-critical bar or all four routes equally.
3. **Post-review:** After you approve, commit with `docs(plan): add plan for GIQ-50` (or merge with feature commit as appropriate), then open PR from suggested branch `feature/giq-50-acc-01-landing-login-form-and-dialog-accessibility` (from Linear).

## Changes log

- _2026-05-04:_ Initial plan written; implementation referenced to `d0ef4607`; validation and WCAG 2.1 AA criteria captured. Not committed per developer request.
