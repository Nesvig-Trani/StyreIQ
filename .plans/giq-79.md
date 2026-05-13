---
status: implemented
ticket: GIQ-79
sprint: local
---

# GIQ-79 / ACC-30 — DataTableSelectFilter: Popover Trigger Missing Accessible Name

Linear: [GIQ-79](https://linear.app/meltstudio/issue/GIQ-79)

## Context

The `DataTableSelectFilter` component renders a Radix `<Popover>` whose trigger is a plain `<Button>`. Without an explicit `aria-label`, the button's accessible name is computed from its visible subtree: a `PlusCircleIcon` SVG (which carries SVG title text that pollutes the announcement) followed by the filter title and dynamic `<Badge>` children showing counts like "2 selected". This is ambiguous — a screen reader user hears no clear "Filter by X" intent and gets no consistent state announcement when options are selected.

**WCAG finding**: SC 4.1.2 Name, Role, Value (Level A) — the accessible name does not unambiguously convey the control's purpose and current state. Level A is within the agreed WCAG 2.1 Level AA standard for this round.

**Affected surfaces** (everywhere `DataTableSelectFilter` renders inside `DataTableToolbar`):

- Social Media page — Status, Platform, Unit, Administrator, optional Tenant column filters
- Users page — optional Tenant column filter

## Files to Modify

| File                                                  | Change            |
| ----------------------------------------------------- | ----------------- |
| `src/shared/components/data-table/filters/select.tsx` | Only file touched |

## Implementation Steps

### 1 — Add `formatSelectFilterTriggerAriaLabel` helper (above the component)

Pure function that builds the accessible name from title + current selection state:

```ts
/** Accessible name for the filter trigger; mirrors visible chips (≤2 labels) vs count-only. */
function formatSelectFilterTriggerAriaLabel(
  title: string,
  selectedCount: number,
  selectedOptions: Pick<DataTableSelectOption, 'label'>[],
): string {
  const lead = `Filter by ${title}`
  if (selectedCount === 0) return lead

  const countPhrase =
    selectedCount === 1 ? '1 option selected' : `${selectedCount} options selected`

  const labelsComplete =
    selectedCount <= 2 &&
    selectedOptions.length === selectedCount &&
    selectedOptions.every((o) => o.label.trim().length > 0)

  if (labelsComplete) {
    const labels = selectedOptions.map((o) => o.label).join(', ')
    return `${lead}, ${countPhrase}: ${labels}`
  }

  return `${lead}, ${countPhrase}`
}
```

Output examples:

- No selection → `"Filter by Status"`
- 1 selected → `"Filter by Status, 1 option selected: Active"`
- 2 selected → `"Filter by Status, 2 options selected: Active, Inactive"`
- 3+ selected → `"Filter by Status, 3 options selected"`

### 2 — Wire the label inside `DataTableSelectFilter`

In the component body, after `selectedOptions` is computed:

```ts
const triggerAriaLabel = formatSelectFilterTriggerAriaLabel(
  title,
  selectedValues.size,
  selectedOptions,
)
```

### 3 — Apply `aria-label` to the trigger Button and hide the icon

```tsx
<Button variant="outline" size="sm" className="h-8 border-dashed" aria-label={triggerAriaLabel}>
  <PlusCircleIcon className="mr-2 h-4 w-4" aria-hidden="true" />
  {title}
  ...
```

### 4 — Label the CommandInput inside the popover

```tsx
<CommandInput placeholder={title} aria-label={`Search ${title} filter options`} />
```

This covers the search input inside the popover which was also unlabelled.

### 5 — Run `pnpm ci:checks`

Verify lint + TypeScript pass before committing.

## Validation Plan

| Check                                                 | How                                                           | Expected                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Trigger announced on Social Media page (no selection) | VoiceOver / axe DevTools or Chrome DevTools a11y panel        | Each filter button announced as "Filter by Status", "Filter by Platform", "Filter by Unit", "Filter by Administrator" |
| Trigger announced with 1 selection                    | Select one option, tab away and back to the trigger           | "Filter by Status, 1 option selected: Active"                                                                         |
| Trigger announced with 3+ selections                  | Select 3+ options                                             | "Filter by Status, 3 options selected" (no label list)                                                                |
| Icon not double-announced                             | Check computed accessible name in DevTools Accessibility pane | Icon's SVG text does not appear in button's announced name                                                            |
| CommandInput labelled                                 | Tab into the popover search field                             | Screen reader announces "Search Status filter options"                                                                |
| Users page Tenant filter (single-select)              | Activate with 1 selection                                     | "Filter by Tenant, 1 option selected: {tenant name}"                                                                  |
| `pnpm ci:checks` passes                               | Terminal                                                      | Exit 0                                                                                                                |
| Run `/melt-ux-audit` on Social Media page             | Chrome DevTools MCP                                           | No new a11y violations introduced                                                                                     |

## Edge Cases

- **`allowMultiple: false` (Users → Tenant)**: Single selection works identically — `selectedValues.size === 1` → "1 option selected: {label}".
- **User without a name in Administrator filter**: `user.name` may be null/undefined in `useSocialMediasTable.tsx`. The helper's `.trim().length > 0` guard falls back to count-only label — safe.
- **All filter instances benefit**: Fix is in the shared component; no per-feature changes needed.

## Non-Code Changes

None — no env vars, migrations, CI changes, or dependencies.
