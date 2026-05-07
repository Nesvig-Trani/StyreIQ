---
status: implemented
ticket: GIQ-67
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-67
git_branch: feature/giq-67-acc-18-landing-login-duplicate-elements-for-screen-reader
---

# GIQ-67 — ACC-18 Landing & Login: duplicate elements for screen reader

Source of truth: [Linear GIQ-67](https://linear.app/meltstudio/issue/GIQ-67).

## Summary

- **Navbar:** Mobile menu panel mounts only when the hamburger is open, so Log In / Get Started (and in-drawer jump links) are not duplicated in the DOM when the menu is closed or in no-CSS layouts. The control uses `aria-label` (`Open menu` / `Close menu`), `aria-expanded`, and `aria-controls` only while open (points at `id="landing-mobile-menu"`). Menu/X icons use `aria-hidden="true"`. `Escape` closes the open mobile menu.
- **Privacy / legal links (current code):** Redundant `title` attributes that **match** the visible link/control text are still present in the footer and FAQ (they repeat the accessible name for screen readers). Remove those `title`s where they duplicate visible text, or replace with non-duplicative labeling if a tooltip is still required.
  - **Footer:** Privacy iubenda anchor — visible “Privacy Policy & Cookie Policy” and `title="Privacy Policy & Cookie Policy"`. Cookie Preferences button — `title="Cookie Preferences"` matches visible text. Terms link — `title="Terms and Conditions of Sale"` matches visible text.
  - **FAQ:** Privacy iubenda anchor — visible “Privacy Policy” and `title="Privacy Policy"`.

## Files

- [`src/features/landing/components/navbar.tsx`](../src/features/landing/components/navbar.tsx) — matches summary above.
- [`src/features/landing/components/footer.tsx`](../src/features/landing/components/footer.tsx) — navbar-adjacent legal row; redundant `title`s as listed.
- [`src/features/landing/components/faq-section.tsx`](../src/features/landing/components/faq-section.tsx) — privacy link still has duplicate `title`.

## Deviations from earlier plan draft

- Defensive `aria-hidden` / `tabindex={-1}` on drawer CTAs when closed was omitted: conditional mount removes those nodes when the menu is closed.
- `aria-controls` is only set when the mobile menu is open so it does not reference a missing `id` when the panel is unmounted.
- Post-render stripping of `title` on iubenda-injected markup was not added: keep attributes in JSX; follow up only if iubenda re-injects a duplicate `title` after load.

## Remaining work (before closing ticket)

- [x] Drop `title` on footer and FAQ anchors/buttons where it equals the visible label (privacy, cookie preferences, terms, FAQ privacy), unless product requires a distinct tooltip string that does not duplicate the accessible name.
- [ ] Re-run checks below and mark developer validation complete.

## Validation

- [x] **`pnpm ci:checks`** — pass (2026-05-07) — re-run after link `title` cleanup.
- [x] **`pnpm build`** — pass (2026-05-07) — re-run after link `title` cleanup.
- [ ] Manual no-CSS / SR / WAVE on `/` (developer)

## Validation Results (Agent)

- [x] `pnpm ci:checks` — pass (2026-05-07): ESLint + `tsc --noEmit` completed successfully.
- [x] `pnpm build` — pass (2026-05-07): Next.js production build completed successfully.
- [x] Navbar — verified by source inspection: mobile block renders only when `isMobileMenuOpen`; `aria-controls`/`aria-expanded`/`aria-label` as described; icons `aria-hidden`; Escape listener registered while open.
- [x] Privacy / legal links — **updated**: footer and FAQ no longer use redundant `title`s matching visible text.
- [ ] Manual no-CSS view on `/` — not run in this session.
- [ ] Screen reader linear navigation on `/` — not run in this session.
- [ ] WAVE (or axe) on `/` — not run in this session.

## Validation Results (Developer)

- [ ] Manual no-CSS, SR, and WAVE checks on `/` — **pending** (required before treating validation as complete).
- Approved: **pending** until the items above are done and recorded here.

## Review Results (Developer)

- **Pending** — human review on the PR is required per AGENTS.md before merge.
- Record outcomes here after review (e.g. approver, date, follow-ups).

## Test Coverage Gaps

- Landing navbar and footer a11y behavior are not covered by automated tests. Optional future check: render test or e2e asserting valid modal/disclosure semantics and a single `/login` link in the default document snapshot (no duplicate hidden desktop+mobile nodes when the drawer is closed).

## Related

- GIQ-50, GIQ-51 (landing/login a11y)
