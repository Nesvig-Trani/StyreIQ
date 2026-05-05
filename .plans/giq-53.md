---
status: implemented
ticket: GIQ-53
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-53
supersedes_giq_51: live-region-policy
---

# GIQ-53 — Polite live regions and ARIA policy

Source of truth: [Linear GIQ-53](https://linear.app/meltstudio/issue/GIQ-53) (Melt Studio workspace).

## Product standards (this round)

- **Conformance target:** **WCAG 2.1 Level AA** for new or changed accessibility behavior.
- **Decorative icons:** If an icon sits beside visible text that already names the control or item, treat it as decorative and set **`aria-hidden="true"`** on the icon (see auth forgot/reset forms and landing feature/process sections).

### ARIA and live regions

- **Avoid aggressive interruptions:** Do **not** use **`role="alert"`** or **`aria-live="assertive"`** for standard form validation errors, shared components, or regular UI feedback.
- **Prefer polite announcements:** Default to **`role="status"`** or **`aria-live="polite"`** for dynamic updates and error summaries so screen readers can announce when the user is idle.
- **Reserve alerts for critical events only:** Use **`role="alert"`** (or assertive live regions) only for high-priority, time-sensitive warnings (e.g. session about to expire, server connection lost). **Auth flows in scope for GIQ-53 do not use `role="alert"`** — including account lockout messaging after failed attempts, which is surfaced as a **polite status** message like other sign-in errors.

## Summary (implementation)

All previously assertive **`role="alert"`** usages in the GIQ-53 scope were replaced with **`role="status"`** **`aria-live="polite"`**:

- Login: custom toasts for **locked account** and **generic sign-in failure** ([`useLogin.tsx`](../src/features/auth/hooks/useLogin.tsx)).
- Forgot password: inline **`submitError`** ([`forgot-password-form.tsx`](../src/features/auth/forms/forgot-password-form.tsx)).
- Reset password: inline **`apiError`** ([`reset-password-form.tsx`](../src/features/auth/forms/reset-password-form.tsx)).
- Create first user: **`toast.error`** payloads ([`useCreateFirstUserForm.ts`](../src/features/users/hooks/useCreateFirstUserForm.ts)).
- Shared form helper: submitted validation summary ([`form-hook-helper/helper.tsx`](../src/shared/components/form-hook-helper/helper.tsx)) — **`role="status"`** was already present; **`aria-live="polite"`** added for explicit alignment with the policy above.

## Files touched (GIQ-53)

| File                                                                                                          | Role                                               |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [`src/features/auth/hooks/useLogin.tsx`](../src/features/auth/hooks/useLogin.tsx)                             | Both login toasts: `status` + `polite`.            |
| [`src/features/auth/forms/forgot-password-form.tsx`](../src/features/auth/forms/forgot-password-form.tsx)     | `submitError`: `status` + `polite`.                |
| [`src/features/auth/forms/reset-password-form.tsx`](../src/features/auth/forms/reset-password-form.tsx)       | `apiError`: `status` + `polite`.                   |
| [`src/features/users/hooks/useCreateFirstUserForm.ts`](../src/features/users/hooks/useCreateFirstUserForm.ts) | Error toast spans: `status` + `polite`.            |
| [`src/shared/components/form-hook-helper/helper.tsx`](../src/shared/components/form-hook-helper/helper.tsx)   | Validation summary: explicit `aria-live="polite"`. |

**Icons:** Auth surfaces in scope already use **`aria-hidden="true"`** on Lucide icons paired with labels or visible control text; no change required for GIQ-53.

## Verification

- `pnpm ci:checks` after edits.
- **Manual:** VoiceOver/NVDA on `/login`, `/forgot-password`, `/reset-password`, `/login/create-first-user` — confirm errors announce via **polite** regions without assertive interruption; lockout and generic failure both polite.
- Optional: axe (or equivalent) on the same routes — no regressions on live-region misuse.

## Relation to GIQ-51

[GIQ-51](.plans/giq-51.md) introduced **`role="alert"`** on several of these surfaces for immediate SR output. **GIQ-53** supersedes that with the team’s **polite-first** policy from Linear; assertive **`alert`** is reserved elsewhere in the product only for truly critical, time-sensitive warnings.
