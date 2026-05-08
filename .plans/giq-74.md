---
status: approved
ticket: GIQ-74
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-74
---

# GIQ-74 — ACC-25 broken ARIA references on global form fields

Source of truth: [Linear GIQ-74](https://linear.app/meltstudio/issue/GIQ-74) · Related: [GIQ-60](https://linear.app/meltstudio/issue/GIQ-60) (tenant governance forms; uses same form helpers).

**Conformance target:** [WCAG 2.1 Level AA](https://www.w3.org/TR/WCAG21/) for this accessibility round—in particular, valid ARIA **name / description programmatic relationship** ([4.1.2 Name, Role, Value](https://www.w3.org/TR/WCAG21/#name-role-value)) and zero **broken reference** violations reported by tooling (e.g. WAVE). Team policy from [GIQ-60 plan](giq-60.md): avoid `aria-live="assertive"` / `role="alert"` for routine validation unless product explicitly requires it.

---

## Requirements summary

- **Problem:** Inputs use `aria-describedby` pointing at `«id»-form-item-description`, but no element with that `id` is in the DOM. WAVE flags broken ARIA references; assistive tech ignores invalid IDs, so contextual copy is missed.
- **Expected fix (Linear):** For every control that exposes `aria-describedby`, the referenced node must exist with a **matching** `id`, **or** `aria-describedby` must be omitted when no description fragment exists.
- **Acceptance:** (1) Focusing affected inputs does not imply broken refs; descriptions are announced without AT errors where copy exists. (2) WAVE (or equivalent) reports **no** broken ARIA reference errors on affected tenant flows: Governance Settings update, and tenant/other create–edit-update forms wired through [`FieldResolver`](../src/shared/components/form-hook-helper/field-resolver.tsx).

---

## Root cause (codebase)

- [`FormControl`](../src/shared/components/ui/form.tsx) always sets `aria-describedby` to `formDescriptionId`, and when errored adds `formMessageId` (prior to fix).
- [`FormDescription`](../src/shared/components/ui/form.tsx) was not used elsewhere in `src/`; helper text lived in tooltip UI in [`FieldLabel`](../src/shared/components/form-hook-helper/field-label.tsx) / [`InputListHelper`](../src/shared/components/form-hook-helper/field-resolver.tsx), not as a described-by target for the actual control ([`TextInputHelper`](../src/shared/components/form-hook-helper/fields/text.tsx) pattern).
- `FormMessage` always renders an element with `formMessageId`, so that half of `aria-describedby` **on error** was valid; **`formDescriptionId` was universally invalid** when no description node mounted.

---

## Design / approach

1. **`FormItem` tracks whether a description is mounted** — extend [`FormItemContext`](../src/shared/components/ui/form.tsx) with `registerDescription` / `unregisterDescription` plus a counter the control can read. Default remains “no description.”
2. **`FormControl` builds `aria-describedby` from existing fragments only:**
   - If description registered → include `formDescriptionId`.
   - If field has validation error → include `formMessageId`.
   - If neither applies → **`aria-describedby` unset**.
3. **Meet Gherkin “announces … description”:** When `fieldData.description` is set, render [`FormDescription`](../src/shared/components/ui/form.tsx) with the same prose as the tooltip **visually hidden** (`sr-only`) in helpers under [`src/shared/components/form-hook-helper/fields/`](../src/shared/components/form-hook-helper/fields/). Do not replace tooltips wholesale—not in ticket scope.

**Explicitly low-risk / unchanged:** [`PhoneInputHelper`](../src/shared/components/form-hook-helper/fields/phone.tsx) does not use `FormControl` today; evaluate separately if QA finds missing instructions there.

---

## Files to modify

| Area    | Path                                                                                                                                                                                                           | Change                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Core    | [`src/shared/components/ui/form.tsx`](../src/shared/components/ui/form.tsx)                                                                                                                                    | Extend `FormItem` context + mount tracking in `FormDescription`; conditional `aria-describedby` in `FormControl`; keep API backward compatible |
| Helpers | `text.tsx`, `text-area.tsx`, `number.tsx`, `select.tsx`, `multiselect.tsx`, `password.tsx`, `date.tsx`, `tree-select.tsx`, `checkbox.tsx` under [`fields/`](../src/shared/components/form-hook-helper/fields/) | Add `sr-only` `FormDescription` when `description` truthy                                                                                      |
| Arrays  | Same pattern where array children repeat descriptions                                                                                                                                                          | One hidden description **per control** aligned with tooltip text                                                                               |

(No migrations, env vars, or deps expected.)

---

## Implementation steps

1. Implement description registration + conditional `aria-describedby` in [`form.tsx`](../src/shared/components/ui/form.tsx); sanity-check `@radix-ui/react-slot` does not overwrite `aria-describedby` from child components.
2. For each touched field helper: when `fieldData.description` is present, insert `<FormDescription className="sr-only">...</FormDescription>` after `FormControl` (or beside label slot per layout) **before** `<FormMessage />`, matching tooltip copy exactly.
3. Run `pnpm ci:checks` ([AGENTS.md](../AGENTS.md)).
4. Smoke-test governor forms: `/dashboard/tenants/update-governance-settings/[tenantId]` and tenant create/edit routes that use `FieldResolver`; run WAVE (or axe DevTools) on those URLs + one non-tenant dynamic form page for regression.

---

## Validation plan

- **Static:** `pnpm lint`, `pnpm type-check`, `pnpm ci:checks`.
- **Automated UX:** Chrome extension WAVE **or** axe — expect **zero** broken ARIA reference errors on validated pages ([Linear acceptance](https://linear.app/meltstudio/issue/GIQ-74)).
- **Assistive tech:** VoiceOver (macOS) and/or NVDA — focus governance and tenant form inputs with `description` configured; verify announcement includes hidden description copy and validation message on error paths.
- **UX completeness:** `/melt-ux-audit` on the touched form surfaces ([AGENTS.md](../AGENTS.md)) for loading/error/empty if applicable.

---

## Edge cases and risks

| Risk                                                        | Mitigation                                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `Slot` merges `aria-describedby` oddly with forwarded props | Prefer single source on `FormControl`; drop duplicate from leaf `Input` if needed |
| Multiple `FormDescription` per item                         | Out of scope; enforce one-per-`FormItem` in helpers                               |
| GIQ-60 open items overlap                                   | Separate tickets; do not widen this PR                                            |

**Suggested branch:** `feature/giq-74-acc-25-global-forms-broken-aria-references-on-form-fields-in` (matches Linear-generated name).

---

## Open questions

- Confirm with design if duplicating tooltip text into `sr-only` `FormDescription` is acceptable (recommended for AA-aligned instructions); alternatively only fix broken refs—but that weakens the Gherkin “announces … description” bar for tooltip-only hints.

---

## Validation Results (Agent)

_Validation run: agent (Cursor), plan path `.plans/giq-74.md`. Chrome DevTools MCP is not configured for this workspace MCP directory (no `chrome-devtools` server under `mcps/`). Browser/WAVE/axe checks below were **not** executed in an automated browser session; use localhost or a preview deploy with WAVE/axe DevTools and/or connect Chrome DevTools MCP via `/melt-link` for follow-up._

- [x] **Static — `pnpm lint` + `pnpm type-check` via `pnpm ci:checks`** — Pass; exit code 0 (`next lint` clean, `tsc --noEmit`).
- [ ] **Automated UX — WAVE or axe (zero broken ARIA reference errors)** — **SKIPPED (no browser automation / Chrome DevTools MCP available in this session).** Evidence must be collected manually on `/dashboard/tenants/update-governance-settings/[tenantId]`, tenant create/edit routes using `FieldResolver`, and one other dynamic form page per plan.
- [ ] **Assistive tech — VoiceOver / NVDA** — **SKIPPED (requires human).** Developer to confirm description + error announcements on fields with `description` and on validation errors.
- [ ] **UX completeness — `/melt-ux-audit`** — **Not run by agent.** Recommend before sign-off if touching form surfaces broadly.

**Implementation spot-check (code):** [`FormControl`](../src/shared/components/ui/form.tsx) builds `aria-describedby` only when `hasRegisteredDescription` and/or `error`; [`FormDescription`](../src/shared/components/ui/form.tsx) registers on mount via `useLayoutEffect`; field helpers render conditional `sr-only` `FormDescription` when `fieldData.description` is set (per GIQ-74 implementation).

---

## Test coverage (gaps)

There is **no** `test` script in `package.json` ([AGENTS.md](../AGENTS.md)). Suggested additions if the team adopts a runner:

1. **Unit / component (e.g. Vitest + RTL):** Render a minimal `FormField` + `FormItem` + `FormControl` + `Input` — assert no `aria-describedby` when `FormDescription` is absent; mount `FormDescription` and assert `aria-describedby` includes `*-form-item-description` and a matching `#id` exists in the container.
2. **Same harness, error path:** Simulate RHF error state and assert `aria-describedby` includes message id(s) without dangling description ids when no description is mounted.

**Ask:** Should these tests be added now (requires introducing Vitest/testing-library if not already present)? Pending product agreement.

---

## Validation Results (Developer)

**Status: pending manual validation**

Developer: answer the observation questions below, run WAVE/axe + AT as in the Validation plan, then record answers here and set `Approved: yes` in frontmatter bump `status` to `validated` when satisfied.

---

## Review Results (Developer)

### Review Brief (Agent)

- **Summary:** Shared [`FormItem`](../src/shared/components/ui/form.tsx) context now tracks mounted `FormDescription` instances (register/unregister + `descriptionCount`). [`FormControl`](../src/shared/components/ui/form.tsx) only sets `aria-describedby` when a description is registered and/or the field has a react-hook-form `error`, eliminating broken references to `*-form-item-description`. Field helpers under [`form-hook-helper/fields/`](../src/shared/components/form-hook-helper/fields/) render a matching `sr-only` `FormDescription` when `fieldData.description` is set, aligning programmatic description with tooltip copy. **Scoped diff vs `main`:** ~159 insertions / 20 deletions across 10 files (within team’s ~200–400 line PR guideline for this slice).
- **Plan deviations:** None material — matches GIQ-74 plan (conditional `aria-describedby`, `useLayoutEffect` registration, `sr-only` descriptions in listed helpers). [`phone.tsx`](../src/shared/components/form-hook-helper/fields/phone.tsx) unchanged per plan (still no `FormControl`).
- **Standards check:** No new `eslint-disable`, `@ts-ignore`, or `as any` in the reviewed files. No automated tests added (repo has no `test` script; gap noted in plan).
- **PRD / validation alignment:** Intent matches WCAG 2.1 AA name/description relationships and Linear acceptance. **Human validation** (WAVE/axe, VoiceOver/NVDA) remains outstanding per **Validation Results (Developer)** — do not treat merge as fully validated until those are done or explicitly waived.

### Areas for human attention

1. **`FormControl` + `Slot` prop order:** `aria-describedby` is set before `{...props}`. A consumer passing `aria-describedby` on `FormControl` can **override** the computed value — confirm no call sites rely on merging (acceptable if intentional escape hatch).
2. **`hasRegisteredDescription` timing:** Driven by `descriptionCount` updated in `FormDescription`’s `useLayoutEffect`. Edge-case: theoretically one frame without `aria-describedby` before layout flush; UX impact should be negligible.
3. **Checkbox multi-option lists:** Same `fieldData.description` repeats as `sr-only` per option when present — redundant announcements for SR users; aligns with plan (“one hidden description per control”) but worth product awareness.
4. **Pre-existing `useFormField` guard:** `if (!fieldContext)` still never triggers because context default is `{}`. Not introduced by this change.
5. **Branch scope:** `git diff main...HEAD` contains many unrelated accessibility commits — for **GIQ-74-only** merge review, isolate `git diff main --` on [`form.tsx`](../src/shared/components/ui/form.tsx) and [`form-hook-helper/fields/`](../src/shared/components/form-hook-helper/fields/) (scoped stat ~159 additions / ~20 deletions).

### Developer review — questions (respond before `Decision`)

1. Did you review the **scoped diff** (`form.tsx` + `form-hook-helper/fields/*`) and confirm **`PhoneInputHelper`** is acceptable to leave unchanged for this ticket?
2. Any **`FormControl` usages** elsewhere that pass **`aria-describedby`** intentionally and might conflict with the new computed attribute?
3. **Validation gap:** Have you completed (or waived) manual **WAVE/axe** + **VoiceOver/NVDA** on governance settings and at least one other `FieldResolver` form — and updated **Validation Results (Developer)**?
4. Comfortable shipping **without** Vitest/RTL coverage for conditional `aria-describedby`, or should tests block merge?

### Developer review — answers

_(Fill in.)_

### Decision

- [ ] approved
- [ ] request changes

_(When approved and validation sign-off matches team policy: set YAML `status` to `reviewed` and optionally `validated` if validation completed.)_
