---
status: aprove
ticket: GIQ-51
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-51
---

# GIQ-51 — ACC-02 Landing & Login: screen-reader notifications

## Requirements summary

From [Linear GIQ-51](https://linear.app/meltstudio/issue/GIQ-51):

- **Objective:** Screen reader users get meaningful names for icons on the login-related surfaces, and **error** feedback delivered via toasts is announced as soon as it appears (without hunting for it).
- **Scope (routes):** `/login`, `/forgot-password`, `/reset-password`, `/login/create-first-user`.
- **Design intent:**
  - Replace generic or non-descriptive icon exposure with text that explains what the icon represents (e.g. “Email address” rather than an unlabeled or generic “icon” name).
  - Ensure error toasts use an appropriate live region semantics — e.g. `role="alert"` and/or `aria-live="assertive"` on the toast content — so errors are announced on render.
  - Confirm with **at least one** screen reader (NVDA and/or VoiceOver per ticket) before closing.
  - No backfill of unrelated surfaces; **visual styling of toasts should stay the same**.
- **Acceptance (functional):**
  - Icons on the login surface have accessible names that reflect what they represent when the reading cursor reaches them.
  - Login error toasts are announced without moving focus to the toast.
- **Verification:** Manual SR pass, visual check that toast styling is unchanged, automated scan with **zero critical** issues on the login surface (axe or equivalent).

**Accessibility standard:** Judge all new or changed behavior against **WCAG 2.1 Level AA**, including [Understanding Name, Role, Value (4.1.2)](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html), non-text content / decorative vs informative treatment where relevant, and [Status Messages (4.1.3)](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html) for toast announcements.

## PRD alignment

Implements **Component A — Landing & Login** from PRD `features/accessibility/prd.md` (cited in Linear). Builds on ACC-01 work (e.g. `autocomplete`, dialog semantics, login error copy in GIQ-50).

## Current codebase notes (recon)

- **Icons**
  - `forgot-password-form.tsx`: `MailIcon` in the email field row and in the success state; `ArrowLeftIcon` inside a “Back to login” control that already has visible text (icon should remain **decorative**: `aria-hidden="true"`).
  - `reset-password-form.tsx`: `LockIcon` beside new/confirm password fields; `ArrowLeftIcon` with visible “Back to login” (decorative).
  - `login-form.tsx`: no leading field icons; `PasswordInput` already uses `aria-label` for show/hide (`Show password` / `Hide password`).
  - `create-first-user`: form via `useFormHelper` — confirm no stray icons on this flow; if any appear, apply the same rules.
- **Toasts:** App uses [Sonner](https://github.com/emilkowalski/sonner) (`src/shared/components/ui/sonner.tsx`, root `Toaster` in `src/app/layout.tsx`). Toast rows render as `<li data-sonner-toast>` **without** built-in `role="alert"` / `aria-live` in the library (verified in `node_modules/sonner/dist/index.js`).
- **Login errors:** `useLogin.tsx` uses `toast.custom()` with custom JSX for locked account and generic sign-in failure — these need an explicit **alert/live** wrapper to satisfy announcement behavior.
- **Create-first-user errors:** `useCreateFirstUserForm.ts` uses `toast.error()` — should be brought in line for **error** announcement (wrapper or equivalent pattern consistent with login).

Inline errors (`submitError` on forgot-password, `apiError` on reset-password) are **not** toasts; optional follow-up if SR testing shows gaps (e.g. `role="alert"` on first paint of persistent error region). **In scope for this ticket only if** they are called out during validation; primary scope remains icons + **error toasts** per Linear.

## Files to modify / create

| Path                                                                              | Change                                                                                                                                                                          |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/auth/forms/forgot-password-form.tsx`                                | Meaningful accessible names for `MailIcon` instances; `aria-hidden` on `ArrowLeftIcon` inside the back control.                                                                 |
| `src/features/auth/forms/reset-password-form.tsx`                                 | Meaningful labels for `LockIcon` (context-specific: new vs confirm); `aria-hidden` on `ArrowLeftIcon`.                                                                          |
| `src/features/auth/hooks/useLogin.tsx`                                            | Wrap custom error toast content in a single root with `role="alert"` (and ensure one concise announcement — avoid duplicate nested alerts).                                     |
| `src/features/users/hooks/useCreateFirstUserForm.ts`                              | Ensure `toast.error` payloads are announced (e.g. wrap message in a node with `role="alert"`, or use a small shared helper for error toast content).                            |
| Optional: `src/shared/components/ui/sonner.tsx` or a tiny `src/shared/...` helper | Only if a **reusable** `ErrorToastBody` (or similar) avoids duplication and keeps copy consistent — keep scope limited to auth/login flows unless the helper is clearly shared. |

## Implementation steps

1. **Icons (forgot / reset)**
   - For icons **next to** fields that already have a visible `<Label>`: either (a) set `aria-hidden="true"` on the SVG if the design goal is purely decorative duplication, **or** (b) per ticket wording, expose a short **`aria-label`** (or `role="img"` + `aria-label`) that names the purpose — e.g. “Email address”, “New password”, “Confirm new password”, and for success envelope “Password reset email sent”. Prefer **one** clear pattern across both forms.
   - For **Back to login** controls: add `aria-hidden="true"` to `ArrowLeftIcon` so the button’s accessible name is the visible text only (avoids “back” duplication).

2. **Login error toasts (`useLogin`)**
   - Wrap each `toast.custom` error body’s outer container with `role="alert"`.
   - Keep existing classes/markup so **visuals unchanged**.
   - Verify links inside the alert remain keyboard operable and that the alert text remains a single coherent message (WCAG: don’t spam multiple simultaneous assertive regions).

3. **Create-first-user error toasts**
   - Apply the same **error announcement** pattern as login for `toast.error` calls (wrap content or use a shared helper).

4. **Regression / consistency**
   - Grep auth routes for other `toast.error` / `toast.custom` on these four routes and align **error** behavior.
   - Do **not** change success toast behavior unless SR testing shows a gap (ticket emphasizes **error** toasts).

5. **Types / lint**
   - Run `pnpm ci:checks` (or at least `pnpm lint` + `pnpm type-check`) on touched files.

## Validation plan

| #   | Check                                           | How                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Icon names                                      | With VoiceOver (macOS) and/or NVDA (Windows), linear-read or navigate to each icon on `/forgot-password` and `/reset-password`; names should describe purpose, not “image” / generic. Back arrow should not double-announce with button text. |
| 2   | Login error toast                               | On `/login`, trigger invalid credentials and locked-account paths if testable; SR should announce the error **without** moving focus to the toast.                                                                                            |
| 3   | Create-first-user error                         | On `/login/create-first-user`, force API error (or mock) and confirm `toast.error` is announced.                                                                                                                                              |
| 4   | Visual                                          | Compare toast appearance before/after — no layout/color regression.                                                                                                                                                                           |
| 5   | Automated                                       | Run axe (browser extension or CI if available) on the four routes; **zero critical** findings on those surfaces.                                                                                                                              |
| 6   | UX audit (optional but recommended for UI work) | Run `/melt-ux-audit` for loading/empty/error patterns if the team uses it for accessibility passes.                                                                                                                                           |

## Edge cases and risks

- **Duplicate announcements:** `role="alert"` on a child while the toast `li` gains focus may interact with SR heuristics — test locked vs generic error paths.
- **Success `MailIcon`:** If treated as decorative only, linear reading might skip it; ticket asks for meaningful description when the cursor **reaches** the icon — prefer an explicit short name for the success illustration.
- **Sonner upgrades:** Behavior is tied to library DOM; if Sonner later adds `aria-live`, avoid double-assertive regions (re-test after upgrades).
- **Inline errors** (forgot/reset): Out of primary scope; if SR misses them, consider a small follow-up ticket for `role="status"` / `aria-live="polite"` on persistent error blocks.

## Non-code changes

- None required unless PM adds env-specific test users for locked-account flow.

## Open questions

1. **Sprint folder:** Plan file lives at `.plans/giq-51.md` (matches GIQ-50). If the team standardizes on `.plans/<sprint>/GIQ-51.md`, move or duplicate when sprint id is known.
2. **Icon pattern:** Confirm with design/PM whether field-leading icons should be **purely decorative** (`aria-hidden`) with labels carrying the name, or **labeled icons** as in the ticket example — implementation should match that decision (both can meet WCAG if labels are programmatically associated and redundancy is controlled).

## Git

Suggested branch from Linear: `feature/giq-51-acc-02-landing-login-screen-reader-notifications` (already suggested on the issue). **Do not commit** this plan until the developer finishes review (per current instruction).
