---
status: implemented
ticket: GIQ-57
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-57
pr: https://github.com/Nesvig-Trani/StyreIQ/pull/132
---

# GIQ-57 — ACC-08 Dashboard: risk category cards and modals accessibility

Source of truth: [Linear GIQ-57](https://linear.app/meltstudio/issue/GIQ-57)

## Requirements summary

- Risk-category cards must be keyboard-activatable (Tab to reach, Enter/Space to open).
- Each card must carry a descriptive accessible name for screen readers.
- The modal close button must be reachable in an efficient number of keystrokes (near the start of tab order, not at the end).
- Focus must return to the originating card when a modal is dismissed.
- Focus trap and `aria-modal` must be verified on the dialog.
- No new constraint — no backfill or fallback required.
- Standard: **WCAG 2.1 Level AA**.

## PRD alignment

- `features/accessibility/prd.md` (Component D — Dashboard).
- Gherkin acceptance criteria defined in the Linear ticket.

## Files modified

- `src/features/dashboard/components/risk-category-card.tsx`
- `src/features/dashboard/components/risk-details-modal.tsx`
- `src/features/dashboard/components/dashboard-client-wrapper.tsx`
- `src/shared/components/ui/dialog.tsx`
- `.plans/giq-57.md`

## Implementation steps

1. **Interactive cards**: `RiskCategoryCard` conditionally renders a semantic `<button type="button">` when `onClick` is provided — keyboard users get native Tab focus, Enter/Space activation, and visible focus ring (`focus-visible:ring-2`). Without `onClick` it renders a neutral `<div>`. When interactive, `onClick` is typed as `MouseEventHandler<HTMLButtonElement>` so parents can use `e.currentTarget`.
2. **Accessible card name**: `aria-label="Open category — {title}"` on each card button gives screen readers a clear, unique control name.
3. **Close button position**: `showCloseButton={false}` suppresses the default corner close. A custom `<DialogClose>` is rendered as the first element inside `DialogContent` (before the scrollable wrapper) and styled with `absolute right-4 top-4` to visually match the top-right corner. This ensures it is natively the **first interactive element** in the modal's tab order, while maintaining the intended visual design.
4. **Focus return on close**: Each card's `onClick` sets `triggerRef.current = e.currentTarget` (the card button) before `openModal` runs. `RiskDetailsModal` accepts `returnFocusRef?: RefObject<HTMLButtonElement>` and uses Radix `onCloseAutoFocus` to `.focus()` that button.
5. **Scrollable list (keyboard)**: The modal body wrapper keeps `tabIndex={0}`, `role="region"`, and `aria-label="Risk details list"` so keyboard users can scroll long issue lists. It now includes `focus-visible:ring-*` classes to clearly indicate when the scrollable region receives focus.
6. **Focus trap**: Radix `Dialog` traps focus; `dialog.tsx` sets `aria-modal="true"` on content (Radix also applies dialog semantics).
7. **Icon ARIA cleanup**: Icon wrapper `<div aria-hidden="true">` hides the subtree; color class is on `<Icon>` via `getIconBg` / `getIconColor`.
8. **Error handling**: The `openModal` calls are asynchronous. Each call now has a `.catch()` block that uses `toast.error` from `sonner` to display a user-friendly error message if the modal data fails to load.

## Review Results (Developer)

- **Addressed PR feedback:**
  - Changed `void openModal` to use `.catch()` with a `sonner` toast error message to properly handle data-fetch rejections.
  - Corrected `DialogClose` DOM order by moving it before the scrollable wrapper to ensure it is the first focusable element, visually positioning it with `absolute` styling.
  - Applied `focus-visible` styling to the `tabIndex={0}` scrollable wrapper for clear focus indication.
  - Fixed `returnFocusRef` type from `RefObject<HTMLButtonElement | null>` to `RefObject<HTMLButtonElement>` and added the necessary `triggerRef` cast.

## Validation

### Acceptance criteria (Gherkin)

| Scenario                                                                            | Status                                                     |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Keyboard user tabs through cards — each is reachable and activates with Enter/Space | ✅ `<button>` with focus ring                              |
| Modal opens — focus moves into modal, close button reachable efficiently            | ✅ `DialogClose` is first interactive element in header    |
| Modal closes — focus returns to originating card                                    | ✅ `returnFocusRef` + `onCloseAutoFocus` + `currentTarget` |

### Static checks

- `pnpm ci:checks` — run locally before merge; must pass (lint + `tsc --noEmit`).

### Manual QA checklist (developer to verify)

- [ ] Tab through all four risk-category cards — each receives visible focus ring.
- [ ] Press Enter/Space on a card — modal opens.
- [ ] In the modal, first Tab press lands on the Close (×) button.
- [ ] Close modal via Close button — focus returns to the card that was activated.
- [ ] Close modal via Escape — focus returns to the originating card.
- [ ] Click a card with the mouse (no prior Tab) — close modal — focus returns to that card.
- [ ] Screen reader (VoiceOver / NVDA) announces card as: _"Open category — Access Management, button"_.

## ARIA policy compliance

- No `role="alert"` or `aria-live="assertive"` introduced.
- Decorative icon wrapper has `aria-hidden="true"`; child `<Icon>` inherits hidden state — no redundant attribute.
- `aria-modal="true"` present on dialog content.

## Open questions

- None — implementation matches ticket intent; confirm manual QA above on preview.
