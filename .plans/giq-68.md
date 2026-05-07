---
status: implemented
ticket: GIQ-68
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-68
git_branch: feature/giq-68-acc-19-dashboard-card-group-navigation-for-assistive
---

# GIQ-68 — ACC-19 Dashboard: card group navigation for assistive technology

Source of truth: [Linear GIQ-68](https://linear.app/meltstudio/issue/GIQ-68).

## Summary

- **Summary statistics:** Top dashboard metrics (`AggregateMetricsView`, `CentralAdminDashboard` when shown, and the four `HeaderMetricCard` tiles) are wrapped in `<section aria-label="Summary statistics">` so screen readers get a named region without a visible group heading.
- **Risk Categories:** Toolbar row, `h2`, and `DashboardRiskSection` are wrapped in `<section aria-labelledby="risk-categories-heading">` with `id="risk-categories-heading"` on the “Risk Categories” heading.
- **Account Status Overview:** Heading and `StatusCard` grid are wrapped in `<section aria-labelledby="account-status-overview-heading">` with `id="account-status-overview-heading"` on the “Account Status Overview” heading.
- The previous single `<section aria-label="Dashboard content">` wrapper was removed to avoid a vague parent landmark over the three named regions.
- **Out of scope (ticket):** `tabindex="-1"` on headings, skip links, and extra keyboard affordances for section labels.

## Files

- [`src/app/(dashboard)/dashboard/page.tsx`](<../src/app/(dashboard)/dashboard/page.tsx>) — three `<section>` landmarks as above; page chrome (title, badges, actions) stays outside these sections.

## Validation plan

Criteria from the implementation plan / ticket (WCAG 2.1 AA, assisted navigation):

| Criterion                  | How to verify                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Section names announced    | VoiceOver (Safari) and/or NVDA (Chrome): navigate by landmarks; Summary statistics uses `aria-label`; Risk / Account Status use `aria-labelledby` + `h2`. |
| Browse mode                | NVDA: arrow into Account Status region; heading “Account Status Overview” read with cards in context.                                                     |
| Tab order unchanged        | Tab through risk category buttons; no regression vs prior build.                                                                                          |
| No visual change           | Compare `/dashboard` before/after; spacing and typography unchanged.                                                                                      |
| Automated scan             | axe DevTools (or similar) on `/dashboard`; no new region/heading issues from this change.                                                                 |
| UX completeness (optional) | `/melt-ux-audit` if team runs UX audits on dashboard changes.                                                                                             |

## Validation

- [x] **`pnpm ci:checks`** — pass (2026-05-07); re-run on 2026-05-07 validate pass (see Agent results).
- [x] **`pnpm build`** — pass (2026-05-07).
- [ ] Manual **VoiceOver** / **NVDA** on `/dashboard` — developer (browser-based; agent skipped — no authenticated browser session in validate run).
- [ ] **axe DevTools** (or similar) on `/dashboard` — developer (agent skipped — no axe in `package.json`; see Agent results).

## Validation Results (Agent)

**Tooling:** Chrome DevTools MCP is **not** available in this Cursor workspace MCP bundle (only Linear, Stripe, Figma descriptors present under project `mcps/`). **Browser-based UI validation was not executed here.** Per AGENTS.md, run **`/melt-link`** and confirm Chrome DevTools MCP if you want agent-driven browser checks on future validates.

- [x] **Implementation vs spec** — Verified in source: [`src/app/(dashboard)/dashboard/page.tsx`](<../src/app/(dashboard)/dashboard/page.tsx>) contains three `<section>` landmarks — `aria-label="Summary statistics"`, `aria-labelledby="risk-categories-heading"` with matching `h2` `id`, `aria-labelledby="account-status-overview-heading"` with matching `h2` `id`; no duplicate `id` values among these; single vague `aria-label="Dashboard content"` wrapper removed; page chrome remains outside `section`s. Method: `read` + `grep`.
- [x] **Heading order** — `h1` “Dashboard” precedes `h2`s inside sections; method: source inspection.
- [x] **`pnpm ci:checks`** — pass (validate run): ESLint + `tsc --noEmit`, exit 0.
- [ ] **Section names announced (SR)** — **SKIPPED (no SR / no live DevTools session)** — requires developer with VoiceOver or NVDA on `/dashboard`.
- [ ] **Browse mode / Account Status context** — **SKIPPED (same)**.
- [ ] **Tab order unchanged** — **PARTIAL:** no JSX reorder of interactive nodes in diff; risk section markup order unchanged aside from `section` wrapper. Full confirmation needs manual Tab on `/dashboard`.
- [x] **No visual change (structural)** — Section wrappers use same utility classes as prior inner `div`s (`mx-auto px-0 py-0`, `mb-8` preserved on grids/sections). Method: source diff review; not screenshot-tested.
- [ ] **axe / automated scan** — **SKIPPED** — no `axe`/`pa11y` script in repo; `npx @axe-core/cli` against `/dashboard` would require a **logged-in** local or preview URL and running app. Developer should run axe DevTools in browser after login.

### Test coverage gap

There are **no automated tests** asserting dashboard landmark structure or `aria-labelledby` targets. Optional follow-ups:

1. **Component/integration:** If the dashboard shell is ever extracted or tested, assert three regions with accessible names (e.g. role `region` and computed accessible name) — likely needs client-visible fragment or E2E.
2. **E2E (recommended):** Playwright/Cypress test against `/dashboard` (authenticated): `getByRole('region', { name: 'Summary statistics' })`, `{ name: 'Risk Categories' }`, `{ name: 'Account Status Overview' }` (exact name matching depends on browser accessible name computation).

**I found 4 validation items without automated test coverage** (SR announcement, browse mode, tab order, axe). Should I write an E2E or RTL test now? Say yes and which runner you prefer (the repo currently has no `test` script in `package.json`).

## Validation Results (Developer)

- [ ] Manual SR and automated scan on `/dashboard` — **pending**.
- Approved: **pending** until recorded here.

### Mandatory manual checks (answer in this section)

Use **localhost** or your **preview deploy** with a user that can open `/dashboard`.

1. In **VoiceOver** (Safari) or **NVDA** (Chrome), navigate by **landmarks/regions**. How many distinct regions do you hear for the dashboard body, and what are their **exact names** as announced (especially the first region that groups the top metric cards)?
2. With NVDA in **browse mode**, move from the “Account Status Overview” heading into the following cards. Does the **region** or **heading** context make it clear you are still in Account Status before each card’s content is read?
3. **Tab** from the “View Audit Log” link (or page start): when focus reaches the **first** Risk Category interactive control, had you passed a focusable control for the “Risk Categories” heading itself, or only for the cards/buttons below — and does the announcement order still feel acceptable?
4. Compare layout to **main** or previous screenshot: are **spacing and typography** unchanged for the three blocks (no unexpected extra margin or width)?
5. Run **axe DevTools** on `/dashboard` after login: list any **critical/serious** issues that mention **region**, **landmark**, or **heading**, if any.

After you answer, add `Approved: yes` (or describe fixes needed) under **Validation Results (Developer)**.

## Related

- GIQ-56 (ACC-07 — related in Linear to dashboard metric associations).
