---
status: implemented
ticket: GIQ-54
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-54
---

# GIQ-54 — ACC-05 Global Navigation: sidebar controls

Source of truth: [Linear GIQ-54](https://linear.app/meltstudio/issue/GIQ-54)

## Requirements summary

- Make sidebar controls fully keyboard and screen-reader accessible in global navigation.
- Ensure the "Toggle Sidebar" control is reachable and activatable via keyboard (remove incorrect tab index behavior).
- Ensure the "Viewing Tenant" text is programmatically associated with the tenant selector control.
- Ensure the mobile sidebar toggle exposes and updates `aria-expanded` and `aria-controls` with sidebar state.
- Follow WCAG 2.1 Level AA for all changes in this round.

## PRD alignment

- Aligns with the ticket's referenced PRD area: `features/accessibility/prd.md` Component B (Global Navigation).
- Focuses specifically on ACC-05 navigation controls and their state announcements.
- Uses the team's updated live-region policy from recent accessibility work:
  - no aggressive announcements (`role="alert"` / `aria-live="assertive"`) for standard feedback,
  - prefer polite/status semantics where announcements are needed.

## Product accessibility constraints (this round)

- **Conformance target:** WCAG 2.1 Level AA.
- **Decorative icons rule:** any icon adjacent to visible text that already names the item/control should use `aria-hidden="true"`.
- **ARIA policy:** reserve alerts/assertive live regions only for critical, time-sensitive events; not for standard form/shared feedback.

## Files to modify/create

- `src/shared/components/ui/sidebar.tsx`
  - Remove/adjust unreachable keyboard behavior on sidebar toggle control.
  - Add/propagate proper `aria-expanded` + `aria-controls` semantics for the mobile toggle trigger.
  - Ensure decorative trigger icon is hidden from AT when adjacent SR/visible label already exists.
- `src/app/(dashboard)/layout.tsx`
  - Wire sidebar trigger props/state IDs as needed so mobile toggle announces controlled region correctly.
- `src/features/tenants/components/tenant-selector.tsx`
  - Associate "Viewing Tenant" label with the combobox trigger (`htmlFor`/`id` or `aria-labelledby`).
  - Mark decorative icons used with visible labels/text as `aria-hidden="true"` where applicable.
- (Optional, only if needed during implementation) `src/shared/components/app-sidebar/index.tsx`
  - Add stable ID/context if required to support `aria-controls` target consistency.

## Implementation steps

1. Confirm current sidebar state flow in `SidebarProvider` (`open`, `openMobile`, `toggleSidebar`) and identify which control(s) are desktop vs mobile.
2. Update sidebar toggle keyboard accessibility:
   - remove incorrect `tabIndex={-1}` behavior from the control expected to be keyboard reachable, or move toggling behavior to the canonical button control if rail should remain pointer-only by design.
3. Add explicit mobile toggle state semantics:
   - bind `aria-expanded` to mobile open state,
   - add stable `aria-controls` linking trigger to mobile sidebar container/sheet region ID,
   - ensure values stay synchronized as menu opens/closes.
4. Fix tenant selector labeling:
   - give the "Viewing Tenant" label a stable association with the combobox trigger using label/control linkage (`id` + `htmlFor`) or `aria-labelledby` when label element type requires it.
5. Apply decorative icon rule in touched surfaces:
   - mark icons next to visible text labels as `aria-hidden="true"`,
   - verify icon-only controls retain an accessible name via visible or SR-only text.
6. Run static validation:
   - `pnpm lint`
   - `pnpm type-check`
7. Run manual a11y QA across desktop/mobile breakpoints and finalize with acceptance criteria checklist.

## Summary (implementation)

- Updated `SidebarTrigger` in `src/shared/components/ui/sidebar.tsx` to expose `aria-expanded` state and mobile `aria-controls`, and marked the trigger icon as decorative (`aria-hidden="true"`).
- Added a stable mobile sidebar region ID and wired it to `aria-controls` via `SheetContent` to keep toggle state linkage explicit for assistive technology.
- Removed `tabIndex={-1}` from `SidebarRail`, making the sidebar toggle control keyboard-reachable.
- Updated `TenantSelector` in `src/features/tenants/components/tenant-selector.tsx` so "Viewing Tenant" is programmatically associated with the combobox trigger via `htmlFor` / `id`, and switched from an overriding `aria-label` to `aria-labelledby`.
- Marked tenant selector icons as decorative (`aria-hidden="true"`) wherever text already communicates control/item meaning.

## Validation plan

- **Keyboard access (desktop):**
  - Navigate to dashboard shell and tab through header/sidebar controls.
  - Expect "Toggle Sidebar" to receive focus in natural order and activate with Enter/Space.
- **Tenant selector accessible name:**
  - Focus "Viewing Tenant" control with a screen reader (VoiceOver/NVDA).
  - Expect the control to announce the label as part of its accessible name.
- **Mobile toggle state announcement:**
  - At mobile breakpoint, focus the sidebar toggle and activate open/close.
  - Expect `aria-expanded` to switch true/false and announcement to reflect expanded/collapsed state.
  - Verify `aria-controls` points to an existing controlled sidebar region element.
- **Decorative icons:**
  - Inspect touched controls/items where text already labels purpose.
  - Expect those icons to have `aria-hidden="true"` and not be redundantly announced.
- **Automated checks:**
  - Run `pnpm ci:checks`.
  - Run accessibility scan on dashboard shell/sidebar and confirm no critical violations.
- **UX completeness check (required for UI views):**
  - Run `/melt-ux-audit` to verify loading/empty/error state quality, navigation continuity, and readable labels.

## Validation run (completed)

- `pnpm lint` — pass.
- `pnpm type-check` — pass.
- Manual screen reader + keyboard verification pending in browser QA (`/melt-validate` / `/melt-ux-audit` recommended).

## Edge cases and risks

- Sidebar has separate desktop and mobile behavior; changes can accidentally regress one while fixing the other.
- If the rail is intentionally pointer-only for layout-resize affordance, converting it to keyboard-stop may create duplicate toggles; implementation must preserve expected UX while meeting ticket acceptance.
- `aria-controls` can become stale if IDs are conditionally rendered or duplicated across breakpoints.
- Tenant selector is a composed Popover/Command pattern; label association must target the interactive trigger element reliably.

## Non-code changes

- No new dependencies expected.
- No env var or infrastructure changes expected.
- No Payload migration or generated type updates expected.
- Linear ticket comment update with this plan (via MCP) once plan draft is saved.

## Open questions

- Sidebar rail was made keyboard-focusable to satisfy reachability requirements. Keep this behavior unless design requests desktop toggle access only through the trigger button.
- Confirm if sprint value should remain `TBD` or be replaced with a specific sprint identifier for planning records.
