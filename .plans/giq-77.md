---
status: implemented
ticket: GIQ-77
sprint: local
---

# GIQ-77: Update User form — label association (Organization + Recent Password Update)

Linear: [GIQ-77](https://linear.app/meltstudio/issue/GIQ-77) (ACC-28)

## What shipped

### [`src/shared/components/tree-select/index.tsx`](src/shared/components/tree-select/index.tsx)

- `FormControl` / Radix `Slot` props (`id`, `aria-describedby`, `aria-invalid`, `className`) are forwarded to the **popover trigger** `<button>` so `FormLabel` `htmlFor` matches the focused control.
- Trigger uses `role="combobox"` with `aria-expanded={open}` and `aria-controls` pointing at a stable `useId()` on **`CommandList`** (not `PopoverContent`), so `jsx-a11y` stays clean without putting `id` on the popover surface.
- Error border uses `errors || ariaInvalid`.

### [`src/shared/components/ui/datepicker.tsx`](src/shared/components/ui/datepicker.tsx)

- `DatePickerProps` extended with `Partial` of trigger props from `Button` (`id`, `aria-describedby`, `aria-invalid`, `className`).
- Those props go to the **outline `Button`** inside `PopoverTrigger`.
- Calendar receives `selected={selected}`, `disabled={disabledDays}`, and `{...dayPickerRest}` only — trigger-only and picker-only props are not spread onto `Calendar`.

### Unchanged for this story

- [`src/features/users/hooks/useUpdateUserForm.tsx`](src/features/users/hooks/useUpdateUserForm.tsx) — still defines Organization / Recent Password Update fields; no form config change needed.

## Verification

- [x] `pnpm ci:checks` (lint + `tsc --noEmit`)
- [ ] Screen reader: **Update User** — tab to Organization combobox and Recent Password Update; each should announce its field label with the control.
- [ ] DevTools: trigger `id` on each control matches the corresponding label `for` (`…-form-item` pattern from [`form.tsx`](src/shared/components/ui/form.tsx)).

## Follow-up (optional)

- [`multiselect.tsx`](src/shared/components/form-hook-helper/fields/multiselect.tsx): same `FormControl` + composite pattern may need the same id-forwarding audit if orphan labels appear there.

## Files touched

- `src/shared/components/tree-select/index.tsx`
- `src/shared/components/ui/datepicker.tsx`
