---
status: implemented
ticket: GIQ-75
sprint: local
---

# GIQ-75: Focus and announcements (Units + Social Audit)

Linear: [GIQ-75](https://linear.app/meltstudio/issue/GIQ-75)

## What shipped

### Units (`UnitHierarchy` / `useUnitHierarchy`)

- Row selection records the triggering **list row button** in `lastSelectedRowTriggerRef` (click and Enter/Space).
- Each selection increments `selectionFocusNonce` so re-selecting the same row still updates focus and the live message.
- Detail panel uses `role="region"` and `aria-labelledby` pointing at an **`h2`** with `tabIndex={-1}`, programmatic focus via `useLayoutEffect`, and visible `focus-visible` ring (WCAG 2.4.7).
- **`role="status"`** + **`aria-live="polite"`** announces `Selected unit: {name}`.
- **Escape** on the detail panel (when not editing) moves focus back to the last row control without clearing selection.

### Social Media → Audit Log (`AuditTab`)

- Audit history entries are native **`button`**s with `aria-label`, `aria-pressed`, and keyboard activation.
- Right column uses a dedicated panel with **`h2`** (focus target), **`aria-live="polite"`** announcement, and **`role="region"`**.
- **Escape** (with a row selected) uses a **document capture** listener to clear detail selection, restore focus to the list row, and **stop the dialog** from closing on the first Escape; second Escape closes the modal as before.

## Verification

- [x] `pnpm ci:checks` (lint + `tsc --noEmit`)
- [ ] Keyboard: Units — Tab to row, Enter → focus on detail `h2`; Escape → focus back on row.
- [ ] Keyboard: Audit — Tab to entry, activate → focus on detail `h2`; Escape → focus on entry, dialog open; Escape again → dialog closes.
- [ ] Screen reader: polite announcements on selection (both surfaces).
- [ ] Optional: `/melt-ux-audit` on Units page and Social Media detail modal (Audit tab).

## Files touched

- `src/features/units/hooks/useUnitHierarchy.tsx`
- `src/shared/components/organization-hierarchy/index.tsx`
- `src/features/social-medias/components/social-media-details/tabs/audit-tab.tsx`
