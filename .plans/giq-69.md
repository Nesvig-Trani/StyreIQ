---
status: approved
ticket: GIQ-69
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-69
---

# GIQ-69 — ACC-20 Global Navigation: sidebar trap on VoiceOver mobile

Source of truth: [Linear GIQ-69](https://linear.app/meltstudio/issue/GIQ-69).

## Requirements summary

- **Feature:** accessibility · **Priority:** P1 · **Category:** Bug
- **Scope:** Dashboard shell mobile sidebar — users with VoiceOver must open/close the sidebar without relying on outside taps; focus must trap within the sheet and return to the hamburger trigger on close.
- **Conformance:** WCAG 2.1 Level AA for changed behavior.
- **Team rules:** No `role="alert"` / `aria-live="assertive"` for routine UI; decorative icons beside visible (or SR) text use `aria-hidden="true"`.

## PRD alignment

- Continues Global Navigation accessibility work (related: GIQ-53/54; Linear relates to ACC-04/ACC-05).

## Files touched

| File                                                                                            | Change                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/shared/components/ui/sheet.tsx`](../src/shared/components/ui/sheet.tsx)                   | Optional `showCloseButton` (default `true`); default close icon `aria-hidden="true"`.                                                                                                                                                                 |
| [`src/shared/components/ui/sidebar.tsx`](../src/shared/components/ui/sidebar.tsx)               | `mobileSidebarTriggerRef` on context; `SidebarTrigger` assigns ref; mobile `SheetContent` with `showCloseButton={false}`, explicit toolbar `SheetClose` (“Close sidebar”), `onCloseAutoFocus` restores focus to trigger; removed `[&>button]:hidden`. |
| [`src/shared/components/app-sidebar/index.tsx`](../src/shared/components/app-sidebar/index.tsx) | Explicit `aria-hidden="true"` on decorative Lucide icons.                                                                                                                                                                                             |

## Implementation summary

1. **Explicit close:** Visible icon-only close control at top of mobile sheet (Radix `SheetClose` + `Button`) with `aria-label="Close sidebar"` and `X` as `aria-hidden="true"`.
2. **Default sheet close hidden** on mobile sidebar only via `showCloseButton={false}`.
3. **Focus return:** `onCloseAutoFocus` on mobile sheet content prevents default when the trigger ref exists and focuses the hamburger `SidebarTrigger` button.
4. **Focus trap / Escape:** Unchanged — provided by `@radix-ui/react-dialog` underlying `Sheet`.

## Validation plan

- **Static:** `pnpm ci:checks`.
- **Keyboard (desktop browser, mobile viewport):** Open sidebar, Tab cycles within sheet, Escape closes, focus returns to hamburger.
- **VoiceOver iOS:** Open via hamburger, navigate inside sheet, activate “Close sidebar”, confirm dismiss without outside tap; confirm focus returns to hamburger.
- **Focus loop acceptance:** From inside the open mobile sheet, advance past the last focusable control and confirm focus returns to the first focusable control inside the sheet (not main content behind the overlay).
- **Visual QA:** Close control does not obscure logo, account card, nav, role switcher, or sign-out.
- **Automated:** axe/Lighthouse on a dashboard route at mobile width — target zero critical issues.
- **UX:** `/melt-ux-audit` on dashboard shell when feasible.

## Validation Results (Agent)

- [x] **Static — `pnpm ci:checks`** — pass (2026-05-07): `next lint` clean; `tsc --noEmit` succeeded.
- [x] **Implementation / markup review** — pass (2026-05-07): `sidebar.tsx` mobile `SheetContent` uses `showCloseButton={false}`; in-sheet `SheetClose` + `Button` with `aria-label="Close sidebar"` and `X` with `aria-hidden="true"`; `onCloseAutoFocus` restores focus to `mobileSidebarTriggerRef` when set; `[&>button]:hidden` removed. `SidebarTrigger` assigns `mobileSidebarTriggerRef` via merged ref callback. `sheet.tsx` default close icon uses `aria-hidden="true"`.
- [ ] **Keyboard — mobile viewport (Tab / Escape / focus return)** — **SKIPPED:** Chrome DevTools MCP is listed in [`.mcp.json`](../.mcp.json) but no DevTools MCP tools were available to this agent session (no `chrome-devtools` descriptors under workspace `mcps/`). Run browser validation locally or reload MCP after `/melt-link`.
- [ ] **VoiceOver iOS — open, close in-sheet, focus return** — **PENDING:** requires physical device / simulator manual pass (developer).
- [ ] **Focus loop — last → first inside sheet** — **SKIPPED:** same browser/MCP gap; implicit behavior expected from Radix Dialog focus trap (not runtime-verified here).
- [ ] **Visual QA — close bar vs. sidebar content** — **SKIPPED:** no screenshot/browser in this session.
- [ ] **axe / Lighthouse — mobile width, zero critical** — **SKIPPED:** no `lighthouse` / `@axe-core` scripts in `package.json`; use browser extension or CI artifact on a running app.
- [ ] **`/melt-ux-audit`** — **NOT RUN** (skill invocation separate from this pass). **Recommendation:** run on dashboard shell after browser MCP works.

### Test coverage gaps

- No automated tests assert mobile sidebar focus restoration, in-sheet close control, or Radix sheet `onCloseAutoFocus` behavior.
- **Suggested follow-up (if you add a test runner):** a Playwright (or similar) test at mobile viewport that opens the dashboard, clicks the sidebar trigger, asserts a focusable control with accessible name “Close sidebar”, activates it, asserts sheet closed and focus on `[data-slot="sidebar-trigger"]` (or trigger `aria-expanded="false"`). Co-locate under `src/shared/components/ui/__tests__/` or an e2e folder per team convention.

**Should I write these automated tests now?** (Requires adding Vitest/Jest + Playwright or equivalent per project decision.)

## Validation Results (Developer)

_Pending._ Answer the observation questions in the PR / chat. After manual sign-off, set frontmatter `status: validated` and record Q&A below.

<!-- Example:
1. Q: ...
   A: ...
Approved: yes
-->

## Git

- Linear suggested branch: `feature/giq-69-acc-20-global-navigation-sidebar-trap-on-voiceover-mobile`.
