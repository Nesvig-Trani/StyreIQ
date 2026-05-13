---
status: approved
ticket: GIQ-80
sprint: none
---

# GIQ-80 / ACC-31 — Filter Popover: Empty Label + Inaccurate Listbox Name

Linear: [GIQ-80](https://linear.app/meltstudio/issue/GIQ-80)

## Context

When the tenant filter popover opens (Users page and Social Media page), two WCAG A violations appear in the `DataTableSelectFilter` component:

1. **Empty `aria-labelledby` target** — cmdk's `Command` root renders a visually hidden `<label>` element. Without the `label` prop, that element is empty. `CommandInput` has `aria-labelledby` pointing to this empty label ID. Screen readers announce "edit text, blank". GIQ-79 applied a workaround (`aria-label` on `CommandInput`), which overrides the broken reference via the accessible name algorithm — but the dangling `aria-labelledby` pointing to an empty element remains in the DOM.

2. **Listbox `aria-label="Suggestions"`** — cmdk's `CommandList` renders `role="listbox"` with `aria-label` defaulting to `"Suggestions"` (confirmed in cmdk source: `let{children:r,label:u="Suggestions",...i}=e`). Neither GIQ-79 nor any prior ticket addressed this. Screen readers announce "Suggestions, listbox" with no content context.

WCAG criteria: SC 1.3.1 Info and Relationships, SC 4.1.2 Name, Role, Value (Level A).

## Component Audit

There is no `SearchableList` component. The filter uses the shadcn `Command` wrapper around cmdk's `CommandPrimitive`. The single shared component is `DataTableSelectFilter` (`src/shared/components/data-table/filters/select.tsx`), used by:

- Users page tenant filter (`allowMultiple: false`)
- Social Media page tenant filter and all other column filters (Status, Platform, Unit, Administrator)

All filter instances benefit from a single file change — no per-feature patches needed.

## Refactor vs. Patch: Recommended Approach

**Fix the ID relationship** by using cmdk's native `label` prop on `<Command>`. Do not switch everything to `aria-label`-only.

**Why**: The `label` prop on `<Command>` fills the hidden `<label>` element's text content, making the `aria-labelledby` on `CommandInput` point to a non-empty label. This is the canonical cmdk pattern and removes the WCAG-flaggable empty reference. The GIQ-79 `aria-label` on `CommandInput` remains — since `aria-label` takes precedence over `aria-labelledby` in the accessible name algorithm, they are compatible (not conflicting). Keeping both provides defense in depth if one is removed in future.

**For the listbox**: Pass `label` prop to `<CommandList>`. cmdk exposes this directly: `label` becomes the `aria-label` on the rendered `role="listbox"` element. No changes to `command.tsx` needed.

## i18n Integration

No i18n framework is active in this project (`next-i18next` is installed but unused; no locale files exist; all strings are hardcoded inline). The fix uses the existing `title` prop dynamically:

- Search label: `` `Search ${title}` `` — e.g., "Search Tenant", "Search Status"
- Listbox label: `` `${title} list` `` — e.g., "Tenant list", "Status list"

This is context-aware via the prop and consistent with how the codebase handles all UI labels today. No i18n work is needed for this ticket.

## Cross-Reference: ACC-25 (GIQ-74) and ACC-28 (GIQ-77)

| Ticket          | Status    | What it fixes                                                                                | Overlaps with GIQ-80?                                                                       |
| --------------- | --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| GIQ-74 (ACC-25) | In Review | broken `aria-describedby` on form field helper messages                                      | No — different attribute, different elements                                                |
| GIQ-77 (ACC-28) | In Review | orphaned outer `<label>` for the Organization `TreeSelect` trigger button (form-field layer) | No — fixes label→trigger association; GIQ-80 fixes inner popover's listbox and search input |

**Conclusion**: No double-patching risk. GIQ-77 and GIQ-74 are both In Review and touch different DOM layers. After they merge, the Organization selector's inner popover (`TreeSelect` uses cmdk) may still show "Suggestions" on its listbox — this is an untracked gap, out of scope for GIQ-80, and should be filed as a follow-up if found during verification.

## Files to Modify

| File                                                  | Change                                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/shared/components/data-table/filters/select.tsx` | Only file touched — add `label` prop to `<Command>` and `label` prop to `<CommandList>` |

No changes to `src/shared/components/ui/command.tsx` — the shadcn wrapper already spreads `...props` on both `CommandPrimitive` and `CommandPrimitive.List`, so props pass through.

## Implementation Steps

### Step 1 — Add `label` prop to `<Command>` (line 153)

Fill the hidden cmdk label element so `CommandInput`'s `aria-labelledby` points to non-empty content:

```tsx
<Command label={`Search ${title}`}>
  <CommandInput placeholder={title} aria-label={`Search ${title} filter options`} />
```

The existing `aria-label` on `CommandInput` stays — it overrides `aria-labelledby` per the accessible name algorithm and remains valid as a defense-in-depth label.

### Step 2 — Add `label` prop to `<CommandList>` (line 155)

Override cmdk's default `"Suggestions"` with a content-describing name:

```tsx
<CommandList label={`${title} list`}>
```

This sets the rendered `<div role="listbox" aria-label="Tenant list" ...>` correctly.

### Step 3 — Run `pnpm ci:checks`

Verify lint + TypeScript pass. Both props are typed in cmdk's component interfaces, so no type errors expected.

## Validation Plan

### Manual (VoiceOver / NVDA) Checklist

| #   | Surface                            | Action                                | Expected announcement                                                                                                |
| --- | ---------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Users page                         | Open the Tenant filter popover        | VoiceOver: "Search Tenant, search field" (not "blank")                                                               |
| 2   | Users page                         | Tab through the open popover          | Listbox announced as "Tenant list" (not "Suggestions")                                                               |
| 3   | Social Media page                  | Open any filter popover (e.g. Status) | Search input: "Search Status, search field"; listbox: "Status list"                                                  |
| 4   | Social Media page                  | Type in the search field              | Current text is read back; no double-announcement of label                                                           |
| 5   | Chrome DevTools Accessibility pane | Inspect `CommandInput` element        | Computed accessible name shows "Search Tenant filter options" (aria-label wins); aria-labelledby target is non-empty |
| 6   | Chrome DevTools Accessibility pane | Inspect `[role=listbox]` element      | Computed accessible name shows "Tenant list"                                                                         |
| 7   | axe DevTools                       | Run on Users page with popover open   | No "4.1.2 Name, Role, Value" violations for the listbox or input                                                     |

### Automated Test (Aspirational — no test runner is currently configured)

If `jest` + `@testing-library/react` were set up, the regression test would be:

```tsx
// src/features/users/__tests__/components/DataTableSelectFilter.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTableSelectFilter } from '@/shared/components/data-table/filters/select'

const mockTable = {
  /* minimal TanStack Table mock */
} as any

it('names the listbox after the filter title', async () => {
  render(
    <DataTableSelectFilter
      table={mockTable}
      isGlobal={false}
      id="tenantId"
      title="Tenants"
      options={[{ label: 'Acme Corp', value: 'acme' }]}
    />,
  )

  await userEvent.click(screen.getByRole('button', { name: /filter by tenants/i }))

  // Listbox must be named after its content, not "Suggestions"
  expect(screen.getByRole('listbox', { name: /tenants list/i })).toBeInTheDocument()

  // Search input must have an accessible name
  expect(screen.getByRole('combobox', { name: /search tenants/i })).toBeInTheDocument()
})
```

> **Note**: To run this test, first set up `jest` + `@testing-library/react` + `@testing-library/jest-dom` as a separate chore. The test above is a verified-correct spec — it will pass once the fix is applied and the test runner is in place.

### CI Check

```bash
pnpm ci:checks   # lint + typecheck — must exit 0
```

## Edge Cases and Risks

- **`allowMultiple: false` (Users → Tenant single-select)**: The `title` prop is the same regardless of `allowMultiple`. Labels will be "Search Tenant" / "Tenant list" — accurate and consistent.
- **All filter instances on Social Media page**: Fix is in the shared component; all five filters (Status, Platform, Unit, Administrator, Tenant) get correct labels automatically. Each gets its own `title`-derived label.
- **GIQ-77 (ACC-28) not yet merged**: The Organization selector's outer label fix is independent. If GIQ-77 merges before or after GIQ-80, there is no conflict — they touch `TreeSelect` (outer label) vs `DataTableSelectFilter` (inner popover).
- **Organization selector's inner popover**: `TreeSelect` uses cmdk internally and will still show "Suggestions" on its listbox after GIQ-80 merges. This is out of scope here — file a follow-up if confirmed during verification.

## Non-Code Changes

None — no env vars, migrations, CI changes, or new dependencies.

## Open Questions

None — requirements are clear, scope is confirmed, cross-references are resolved.
