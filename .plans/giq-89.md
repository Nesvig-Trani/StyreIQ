---
status: approved
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
