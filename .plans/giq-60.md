---
status: implemented
ticket: GIQ-60
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-60
---

# GIQ-60 — ACC-11 Tenants: governance settings forms

Source of truth: [Linear GIQ-60](https://linear.app/meltstudio/issue/GIQ-60).

## Requirements Summary

- **Feature:** accessibility · **Priority:** P1 · **Category:** Bug
- **Scope:** tenant governance settings forms, especially repeatable reminder/escalation schedules and required governance controls.
- **Conformance target:** WCAG 2.1 Level AA for all new or changed accessibility behavior.
- **Acceptance:** add/remove controls name what they affect, fieldsets have meaningful legends, mandatory fields are announced as required, and placeholder text meets AA contrast against the input background.
- **Team rules:** no `role="alert"` or `aria-live="assertive"` for routine form validation or shared feedback; use `role="status"` / `aria-live="polite"` if a dynamic announcement is needed. Decorative icons beside visible text use `aria-hidden="true"` and do not repeat `aria-hidden` on children of an already-hidden parent.

## PRD Alignment

- Aligns with `features/accessibility/prd.md`, Component F — Tenants, as referenced by Linear.
- Continues the accessibility update round standardized on **WCAG 2.1 Level AA** and the polite-first ARIA policy captured in [GIQ-53](giq-53.md).
- Complements the data-table tenant accessibility work in GIQ-58/GIQ-59 by focusing on the separate tenant governance form surface, not the tenants list/table.

## Current Findings

- Governance settings route: [`src/app/(dashboard)/dashboard/tenants/update-governance-settings/[tenantId]/page.tsx`](<../src/app/(dashboard)/dashboard/tenants/update-governance-settings/[tenantId]/page.tsx>).
- Governance settings form shell: [`src/features/tenants/forms/update-governance-settings/index.tsx`](../src/features/tenants/forms/update-governance-settings/index.tsx).
- Governance field definitions and placeholders: [`src/features/tenants/hooks/useUpdateGovernanceSettings.tsx`](../src/features/tenants/hooks/useUpdateGovernanceSettings.tsx).
- Required schema fields: [`tenantGovernanceSettingsSchema`](../src/features/tenants/schemas/index.ts) makes `reminderSchedule`, `escalationDays`, `rollCallFrequency`, and `passwordUpdateCadenceDays` mandatory.
- Repeatable array UI is shared in [`InputListHelper`](../src/shared/components/form-hook-helper/field-resolver.tsx): it currently renders a `<fieldset>` without a `<legend>`, generic visible `Add` / `Remove` button text, and visual `*` required markers only.
- Standard field labels are shared in [`FieldLabel`](../src/shared/components/form-hook-helper/field-label.tsx): it shows the same visual `*` required marker without an explicit screen-reader required announcement.
- Placeholder styling is shared in [`Input`](../src/shared/components/ui/input.tsx), [`Textarea`](../src/shared/components/ui/textarea.tsx), and [`SelectTrigger`](../src/shared/components/ui/select.tsx) via `placeholder:text-muted-foreground` / `data-[placeholder]:text-muted-foreground`. Current tokens use `--muted-foreground: oklch(0.556 0 0)` on white/light backgrounds and `oklch(0.708 0 0)` in dark mode; verify AA contrast before changing tokens.

## Open PR / Conflict Review

- PR [#134](https://github.com/Nesvig-Trani/StyreIQ/pull/134) (`GIQ-59`) touches shared data-table and select primitives, including [`src/shared/components/ui/select.tsx`](../src/shared/components/ui/select.tsx). If GIQ-60 needs select placeholder/chevron changes, rebase after #134 or isolate changes to form helpers unless token-level contrast work requires the shared select primitive.
- PR [#133](https://github.com/Nesvig-Trani/StyreIQ/pull/133) (`GIQ-58`) touches tenants table files and shared data-table table semantics. No direct overlap with governance settings form helpers.
- PR [#132](https://github.com/Nesvig-Trani/StyreIQ/pull/132) (`GIQ-57`) touches dashboard risk modal/card files and shared dialog. No direct overlap with governance settings forms.
- PR [#64](https://github.com/Nesvig-Trani/StyreIQ/pull/64) touches `package.json` for dependency security. Avoid dependency changes in this story.

## Files To Modify / Create

- [`src/shared/components/form-hook-helper/field-resolver.tsx`](../src/shared/components/form-hook-helper/field-resolver.tsx)
  - Add a meaningful `<legend>` for array fieldsets, using the array field label.
  - Keep valid fieldset semantics: children should be `<legend>` and grouped content, not standalone decorative icons directly inside list semantics.
  - Change add/remove controls to contextual labels such as `Add Reminder Schedule` and `Remove Reminder Schedule item 1`; use accessible labels if visible copy must remain short.
  - Add required semantics for array fields (`aria-required="true"` where applicable), while keeping the visual asterisk.
  - Mark purely decorative help icons as `aria-hidden="true"` only if the tooltip trigger/text still has an accessible name.
- [`src/shared/components/form-hook-helper/field-label.tsx`](../src/shared/components/form-hook-helper/field-label.tsx)
  - Add an accessible required announcement to field labels, preferably a visually hidden `required` text adjacent to the visual asterisk so all helper fields benefit.
  - Keep color classes scoped to the asterisk/error text only; do not put destructive text classes on parent wrappers.
- Field helpers used by governance fields, likely:
  - [`src/shared/components/form-hook-helper/fields/number.tsx`](../src/shared/components/form-hook-helper/fields/number.tsx)
  - [`src/shared/components/form-hook-helper/fields/select.tsx`](../src/shared/components/form-hook-helper/fields/select.tsx)
  - Add `aria-required={isRequired || undefined}` to native/composed controls; use native `required` only where it does not fight React Hook Form validation UX.
  - Ensure decorative select scroll icons use `aria-hidden="true"` if not already covered by shared select changes from PR #134.
- [`src/features/tenants/hooks/useUpdateGovernanceSettings.tsx`](../src/features/tenants/hooks/useUpdateGovernanceSettings.tsx)
  - Add any field-specific configuration needed for contextual array labels if the shared helper needs explicit singular item names.
  - Consider moving range guidance out of placeholders into labels/descriptions if contrast alone does not provide a robust AA experience.
- [`src/shared/components/ui/input.tsx`](../src/shared/components/ui/input.tsx), [`src/shared/components/ui/textarea.tsx`](../src/shared/components/ui/textarea.tsx), and possibly [`src/shared/components/ui/select.tsx`](../src/shared/components/ui/select.tsx)
  - Adjust placeholder color classes/tokens only if contrast testing shows `muted-foreground` fails AA in the relevant light/dark states.
  - Coordinate `select.tsx` changes with PR #134 before implementation.

## Implementation Steps

1. **Rebase / sync:** Start from latest `dev`, then check whether PR #134 has merged because it can overlap `select.tsx`.
2. **Array fieldsets:** Update `InputListHelper` so each array fieldset has a proper `<legend>` derived from the field label. Preserve layout by using visually appropriate legend styling rather than replacing the visible group title with an unrelated element.
3. **Contextual add/remove names:** Derive contextual button names from `fieldData.label`. Keep visible text concise if desired, but ensure the accessible name includes the affected schedule and item index.
4. **Required announcement:** Centralize visual + screen-reader required handling in `FieldLabel`, then wire `aria-required` into the number/select helpers used by this form and the array group in `InputListHelper`.
5. **Placeholder contrast:** Check the effective placeholder color for native inputs and Radix select placeholder state against the actual input backgrounds. If `muted-foreground` fails AA, prefer a token/class adjustment that preserves shared styling consistency; if it passes, document the contrast result in the validation record.
6. **Decorative icon pass:** In touched form helpers and the route breadcrumb, mark icons decorative where visible text already names the purpose. Do not add redundant `aria-hidden` to children of an `aria-hidden` wrapper.
7. **Static validation:** Run `pnpm ci:checks`.
8. **Manual accessibility QA:** Verify with VoiceOver and/or NVDA on the governance settings route; run an automated accessibility scan with zero critical issues.

## Validation Plan

- **Static:** `pnpm lint`, `pnpm type-check`, `pnpm ci:checks`.
- **Manual screen reader:** On `/dashboard/tenants/update-governance-settings/[tenantId]`, confirm:
  - `Reminder Schedule` and `Escalation Days` groups announce as fieldsets with legends.
  - Add buttons announce the affected group, for example `Add Reminder Schedule`.
  - Remove buttons announce the affected group and row/item, for example `Remove Escalation Days item 2`.
  - Required governance controls announce required, not only a visual asterisk.
- **Keyboard:** Tab through the form. Add and remove controls are reachable, activate with Enter/Space, and focus order remains logical after adding/removing rows.
- **Contrast:** Use browser DevTools, axe, or a contrast checker to verify every governance placeholder meets WCAG 2.1 AA contrast against its rendered background in light and dark states if dark mode is supported.
- **Automated scan:** Axe/Lighthouse on the governance settings page; zero critical issues, with special attention to form labels, fieldsets, required controls, and placeholder contrast.
- **Visual regression:** Confirm the form layout, spacing, and card/header typography remain consistent with sibling dashboard form surfaces.
- **UX completeness:** Run `/melt-ux-audit` on the governance settings form to verify loading/error/empty handling, back/cancel behavior, readable labels, and form interaction quality.

## Edge Cases And Risks

- `InputListHelper` is shared by other tenant forms (`create` / `update` tenant training arrays). Contextual add/remove and fieldset legend changes may improve those forms too, but visually inspect at least one non-governance array form to avoid regressions.
- `FormLabel` depends on `useFormField`; moving label structure around must preserve `htmlFor` and error state styling from the shared form primitives.
- Adding native `required` can trigger browser validation UI that may conflict with React Hook Form. Prefer `aria-required` unless native behavior is intentionally desired and tested.
- Placeholder token changes can affect many shared inputs. Keep the change minimal and document any cross-app impact.
- PR #134 can touch `select.tsx`; resolve by rebasing before implementation or limiting this ticket to governance/form-helper changes until it merges.

## Non-Code Changes

- No database migrations, Payload generated types, environment variables, or new dependencies expected.
- Record manual screen-reader and contrast results here before moving Linear out of Todo.

## Summary (Implementation)

- Added proper `<legend>` text to repeatable governance array fieldsets and contextual add/remove button names in the shared `InputListHelper`.
- Added screen-reader-only `required` text beside visual asterisks and `aria-required` on governance number/select controls.
- Added explicit required metadata and contextual array item labels to the tenant governance field config.
- Increased shared input/textarea/select placeholder contrast from muted foreground to foreground at 70% opacity.
- Marked decorative icons hidden in touched form helpers, select primitives, and the governance breadcrumb.
- **Verification:** `pnpm ci:checks` — pass; `ReadLints` on touched files — no linter errors.

## Git

- Suggested branch from Linear: `feature/giq-60-acc-11-tenants-governance-settings-forms`.
- Do not merge without developer review and manual accessibility sign-off.

## Changes

- _2026-05-06:_ Implemented GIQ-60 accessibility updates and recorded automated validation results.
- _2026-05-06:_ Updated via `/melt-plan` to add explicit PRD alignment and `/melt-ux-audit` validation coverage while keeping `sprint: TBD`.
