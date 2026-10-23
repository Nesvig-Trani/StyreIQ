---
status: reviewed
ticket: GIQ-89
sprint: none (flat .plans layout)
---

# GIQ-89 — Training resources not displaying in Safari

## Context

Client (2026-10-22): Safari 17.4.1 / macOS Sonoma 14.4.1 crashes the tab on every training, also in private mode. Two `.ips` crash reports show the same WebContent crash (`EXC_BAD_ACCESS` at 0x38): `Node.appendChild` → `Style::ChildChangeInvalidation::invalidateForHasAfterMutation` → `SelectorChecker::checkOne`. That is a WebKit `:has()` invalidation bug, not an app logic error.

Static findings (2026-10-22/23):

- The trainings are Articulate Rise exports in `private/trainings/{governance-essentials,risk-mitigation,leadership-guide}`, served by `src/app/api/serve-training/[...path]/route.ts` (rewrite `/trainings/:path*` in `next.config.mjs`) and opened in a new tab from `forms/training.tsx` and `dashboard/resources/page.tsx`.
- Each export has about 150 `:has()` rules: `lib/rise/6df44b14.js` (112, e.g. `&:has([data-color=blue])`), `lib/rise/*.css` (39 + 2, e.g. `table.fr-alternate-rows:has(> tbody > tr:first-child > th)`), `lib/mondrian/*.js` (6, e.g. `:has(svg)`, `:has([arc-toast-heading])`).
- StyreIQ's own UI also uses `has-*` (`button.tsx`, `sidebar.tsx`, `card.tsx`, `table.tsx`, `calendar.tsx`), but not on the training content tab.
- Local check (2026-10-23, newer Safari, `localhost:3004`, 3 courses, first 2 modules each): no crash. The bug is NOT reproducible on current Safari, so it is likely already fixed in newer WebKit.

## Acceptance criteria

1. Reproduce the crash.
2. Determine whether it is Safari-specific.
3. Fix identified and applied.

## Steps

1. **Reproduce on Safari 17.4.x (blocking).** Needs the client's version, so use one of:
   - macOS 14.4.1 VM (Tart/UTM on Apple Silicon) with its stock Safari 17.4.1;
   - BrowserStack / real device on Sonoma with Safari 17.4.
     Run the three courses via `/trainings/<name>/index.html`. Record `before-<n>.png` and crash notes in `StyreIQ-tickets/GIQ-89/repro/`.
2. **Bisect the trigger.** On the repro browser, serve copies of a course with `:has()` rules removed in groups (rise JS, rise CSS, mondrian JS) to find the rule or component that crashes. Also check Chrome and Firefox (AC2) and the latest Safari (already fine).
3. **Fix (depends on step 2).**
   - Preferred: rewrite the offending `:has()` rules in the three exports to selectors or classes that do not use `:has()` (or strip them where only cosmetic), committed under `private/trainings/*`.
   - Alternative if the rules sit in minified JS that is risky to edit: transform CSS/JS responses in `serve-training/[...path]/route.ts` for matching files (documented, with a test).
   - Do not ask users to update their browser.
4. **Tests.** If the route transforms responses, add cases in `src/app/__tests__/api/serve-training-route.test.ts` (output has no unsafe `:has(`, other files untouched, content types unchanged). If files are edited, a test or script asserting none of the three courses contain the crashing selector.
5. Run `yarn lint`, `yarn type-check`, and the tests. Commit with conventional commits, `(GIQ-89)` in subject.

## Validation plan

- On the Safari 17.4.x repro device: open each of the three courses, go through at least the first modules, interact with the elements that trigger DOM changes (tables, toasts, select items, avatars). Expected: no crash, content renders.
- Chrome, Firefox and latest Safari: courses still render and behave the same (no visual regressions: tables, avatar colors, toasts, buttons with icons).
- In-app: Resources → training link and Start Training from a task still open the course.

## Risks

- Cannot confirm the cause or the fix without Safari 17.4.x; a "defensive" `:has()` rewrite without a repro may not fix it.
- Editing minified vendor bundles is fragile, and a Rise re-export would overwrite our changes. Document the change.
- Large files (about 85 MB in `private/trainings`) mean big diffs.

## Non-code changes

None (no migrations, env vars or dependencies). Needs access to a Safari 17.4.x environment.

## Open questions

1. Can we get a Safari 17.4.x environment (macOS 14.4 VM, BrowserStack)?
2. If not, is a defensive `:has()` rewrite without confirmation acceptable, with the client verifying after deploy?
3. Does the client have the original Rise projects, so we can re-export with a different theme or version instead of patching?

## Changes

- Reproduced on Safari 17.4.1 (macOS 14.4.1 VM). Bisected to 6 selectors (7 `:has(` occurrences) of the Arc modal styles in `lib/rise/6df44b14.js`; fixed with `scripts/patch-training-safari.mjs` instead of re-serving or transforming in the route. Step 4 test: `src/app/__tests__/api/training-safari-selectors.test.ts`.

## Validation Results (Agent)

- [x] Safari 17.4.1 (macOS 14.4.1 VM): risk-mitigation, governance-essentials and leadership-guide load, no tab crash — verified manually by the developer (after clearing Safari's cache; the first retest crashed because Safari served the cached old bundle)
- [x] Crash reproduced before the fix on Safari 17.4.1 (risk-mitigation: "A problem repeatedly occurred")
- [x] Chrome (current): all 3 courses render the landing page (title, content, Start Course) — verified via Chrome DevTools MCP; no console errors. One vendor warning, `Unsatisfied version ^5.0.0 ... svelte` (module federation), unrelated to the CSS change
- [x] Served files are patched: over HTTP each bundle has 105 `:has(` left and 7 disabled
- [x] `yarn lint`, `yarn type-check`, `yarn test` — 166 files, 1977 tests, 0 failures; new test fails without the patch (3 failures) and passes with it
- [x] Latest Safari on the host Mac after the patch: governance-essentials loads with no issues — verified manually by the developer
- [ ] Firefox — NOT tested
- [x] Modals: walked all 7 lessons of risk-mitigation in Chrome with a MutationObserver; the Arc modal (`[arc-modal]`, the component the 6 disabled rules style) never appeared. Only `react-medium-image-zoom` dialogs (`data-rmiz-modal`) opened, which the patch does not touch. Not covered: quiz feedback in the other lessons and the other two courses
- [ ] In-app path (Resources / Start Training from a task) — SKIPPED: the test user has no training tasks; the direct `/trainings/...` URLs serve the same content

## Validation Results (Developer)

All answers observed in the Safari 17.4.1 VM unless noted.

1. Q: Title and main button label on the first screen of risk-mitigation?
   A: "Social Media Risk Mitigation Course" and "Start course".
2. Q: Title of the first module after starting, and does the course keep loading?
   A: "Terms of Use", and yes it keeps loading.
3. Q: Module 1 accordion, image zoom, and Final Knowledge Check behaviour?
   A: "Unauthorized Access" expands and is readable; an image zooms and closes with Esc or a click outside; answering Final Knowledge Check question 1 shows inline feedback ("Incorrect" with explanation), no pop-up, no crash (confirmed in the Safari VM).
4. Q: Current Safari on the host Mac, governance-essentials?
   A: "Social Media Governance Essentials: Accessibility, Compliance & Risk" loads, no issues.

Approved: yes

## Review Results (Developer)

### Review Brief

- Summary: disables 6 `:has()` selectors (7 occurrences) in the Arc modal styles of `lib/rise/6df44b14.js` in all three courses via `scripts/patch-training-safari.mjs`; new test `training-safari-selectors.test.ts` keeps them out. About 95 added / 18 removed non-plan lines.
- Plan deviations: disabled (dropped) the rules instead of rewriting them; Firefox check not done.
- Standards violations: none.
- Flagged for human attention: rules disabled for all browsers; Safari 17.4.1 bisect done only on risk-mitigation and the other courses only checked for loading; 105 other `:has()` rules remain; script prints nothing if the bundle is renamed (the test fails loudly); exact-text matching breaks on a newer Rise export; one-hour cache on `serve-training`; vendor bundles edited by hand.

### Developer Review

The developer did not answer the three targeted questions one by one; they gave an explicit decision only.

Decision: approved
