---
status: implemented
ticket: GIQ-61
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-61
---

# GIQ-61 — ACC-12 Tenants: tree view accessibility

Source of truth: [Linear GIQ-61](https://linear.app/meltstudio/issue/GIQ-61).

## Product standards (this round)

- **Conformance:** WCAG 2.1 Level AA for changed behavior and badge contrast.
- **Expand/collapse:** `aria-expanded` on each toggle, synced with `expandedNodes`. No `role="alert"` / `aria-live="assertive"` for routine UI.
- **Rows:** Keyboard-reachable unit selection via `role="button"`, `tabIndex={0}`, `Enter`/`Space`, `aria-pressed` for selection; expand control remains a separate focus target (no nested `<button>`).
- **Icons:** Decorative `Lucide` icons use `aria-hidden="true"` where visible text or control labels convey meaning; no redundant `aria-hidden` on children of already-hidden parents.
- **Badges:** Unit type badge uses `variant="outline"` with `text-foreground` / `border-border` for stronger contrast than `secondary` on the tree row.

## Summary (implementation)

- **[`src/features/units/hooks/useUnitHierarchy.tsx`](../src/features/units/hooks/useUnitHierarchy.tsx):** Split row into expand `Button` (`aria-expanded`, `type="button"`) and focusable selection region with `aria-label` built from name, type, and status; `aria-hidden` on type/status icons; badge contrast as above; leaf placeholder `aria-hidden` spacer.
- **[`src/shared/components/organization-hierarchy/index.tsx`](../src/shared/components/organization-hierarchy/index.tsx):** Search field `aria-label`; search icon decorative; tree list wrapped in `<section aria-label="Organization units tree">`; `aria-hidden` on Edit/Cancel/Disable icons adjacent to text; empty-state icon decorative.

## Overlap with other PRs

- Open PR **#135** (governance forms / form-helper) and **#134** (data-table) do not touch these files; no conflict expected.

## Validation

- [x] **`pnpm ci:checks`** — pass.
- [ ] **Manual:** Keyboard tab order on `/dashboard/units` through filters, expand, each unit row, pagination; SR announces expanded/collapsed on toggle.
- [ ] **Contrast:** Spot-check unit-type badge on default and selected row backgrounds.
- [ ] **Automated:** axe / Lighthouse on `/dashboard/units` — zero critical a11y issues (per ticket).
- [ ] **`/melt-ux-audit`** on Units view when convenient.

## Open / follow-up

- Full WAI-ARIA Tree pattern (roving tabindex, arrow keys) deferred; current pattern matches ticket acceptance with tab-to-item and expand control semantics.
