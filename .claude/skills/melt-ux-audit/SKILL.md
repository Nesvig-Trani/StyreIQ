---
user-invocable: true
description: >-
  Review the project's UI against usability heuristics using Chrome DevTools
  MCP. Use when the developer wants to check UX quality, says "review the UI",
  or "UX audit". In full audit mode, crawls the entire app. During an active
  plan, scopes to the current feature and appends results to the plan file.
---

# UX Audit

Review the project's user interface against established usability heuristics and a UI completeness checklist. Operates in two modes: full project audit or feature-scoped audit during active development.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill ux-audit 2>/dev/null &
```

## Important

- This skill reviews the **live, running application** via Chrome DevTools MCP — not just code. The app must be running (localhost or deployed URL)
- Focus on basic UI completeness, not visual design or aesthetics. The goal is catching missing functionality that makes interfaces unusable (no back button, raw DB labels, lost pagination state)
- Every finding must include evidence: what you saw, what URL, what you expected vs what happened
- When in doubt, flag it. A false warning costs seconds to dismiss; a missed issue costs hours of user frustration

## Mode Detection

Before starting, determine which mode to operate in:

1. **Check for an active plan**: Read the current branch name and extract the ticket ID. Search `.plans/` for a matching plan file.
2. **If a plan exists** → **Feature mode**: scope the audit to the views created or modified by this feature. Results get appended to the plan file as a `## UX Review` section.
3. **If no plan exists** → **Full audit mode**: audit the entire application. Results produce a standalone report file (same pattern as `/melt-audit`).

---

## Feature Mode (Active Plan)

### 1. Understand the Feature Scope

- Read the plan file to understand what was built: which pages, views, components, and flows
- Identify the view types involved (list/table, detail, form, static content)
- Determine the URL(s) to check

### 2. Check Chrome DevTools MCP Availability

- Verify Chrome DevTools MCP is available by attempting to use it
- If not available, tell the developer: "The UX audit requires Chrome DevTools MCP to inspect the live application. Run `/melt-link` to set it up and verify it works."
- If the developer declines, fall back to **code-only review**: inspect components in the source code for missing states, labels, navigation elements. Note in the results that browser-based validation was skipped.

### 3. Run the Checklist

Navigate to each relevant URL and check the applicable items from the checklist below (based on the view types identified in step 1). For each item:

- **Test it interactively** — click buttons, submit forms, use browser back, change pages, apply filters
- Record what you observe: pass, warning, or missing

### 4. Record Results

Append a `## UX Review` section to the plan file:

```markdown
## UX Review

Audited by: AI (melt-ux-audit skill)
Date: {today's date}
Scope: {feature description from plan}

### /path/to/page (List View)

- ✅ Total count displayed — "Showing 24 results" visible above table
- ❌ Column labels use DB field names — `created_at` should be "Created" or "Date Created"
- ⚠️ Pagination works but state not in URL — navigating to page 3 then refreshing resets to page 1
- ✅ Empty state present — "No meetings found" with CTA to create one

### /path/to/detail (Detail View)

- ❌ No back button — only way to return is browser back, which resets list state
- ✅ URL is deep-linkable — sharing /meetings/123 loads correctly
```

If issues are found, suggest specific fixes for each one.

---

## Full Audit Mode (No Active Plan)

### 1. Discover the Application

- Ask the developer for the application URL (localhost or deployed)
- Ask if there are specific areas they want to focus on, or if you should audit everything
- If Figma designs are available, ask for the Figma link for design comparison

### 2. Check Chrome DevTools MCP Availability

Same as feature mode — Chrome DevTools MCP is required for full audits. If not available, tell the developer to run `/melt-link` to set it up and verify it works. A full UX audit without browser access is not meaningful — do not proceed with code-only review in full audit mode.

### 3. Map the Application

Navigate to the application root and map the main views:

- Identify the navigation structure (sidebar, top nav, tabs)
- List all main pages/views and categorize each as: **List/Table**, **Detail**, **Form**, or **Static Content**
- Note any multi-step flows (onboarding, checkout, wizards)

Present the map to the developer: "I found N views to audit. Here's what I'll check: [list]. Should I proceed with all of them, or focus on specific ones?"

### 4. Run the Checklist

For each view, work through the applicable checklist section below. Navigate to the page, interact with it, and test each item.

#### Four States Check (applies to ALL data-driven views)

Every view that displays data from an API must handle four states. For each view, verify:

| State       | What to check                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading** | Trigger a page load. Is there a skeleton, spinner, or progress indicator? Or does the page go blank/flash?                                            |
| **Empty**   | If possible, create a state with no data. Does it show a helpful message and CTA? Or just "No results" or a blank table?                              |
| **Error**   | If possible, trigger an error (disconnect network, use invalid params). Does it show what went wrong and how to recover? Or a blank page / raw error? |
| **Content** | When data is present, does it render correctly with all interactive affordances?                                                                      |

#### List / Table Views

Navigate to the page. Then check:

- [ ] **Total count** — Is a result count displayed (e.g., "Showing 24 results")? Does it update when filters change?
- [ ] **Column labels** — Are headers human-readable? Look for raw DB names like `created_at`, `org_id`, `is_active` — these should be "Created", "Organization", "Status"
- [ ] **Sort indicators** — If columns are sortable, is the active sort column and direction visually indicated?
- [ ] **Filters** — Are obvious filters present for the data type? Do they show their current active state? Is there a "clear all" option?
- [ ] **Pagination in URL** — Navigate to page 2 or 3, then refresh the browser. Does it stay on the same page? Copy the URL and open in a new tab — does it load the correct page?
- [ ] **Filter state in URL** — Apply a filter, then refresh. Is the filter preserved? Copy the URL — does it load with the filter applied?
- [ ] **Empty state** — If testable, trigger an empty result (filter that matches nothing). Is there a helpful message? A CTA?
- [ ] **Loading state** — On initial load, is there a skeleton or spinner? Or does it flash/blank?
- [ ] **Dates and numbers** — Are they formatted for the locale? (e.g., "Mar 18, 2026" not "2026-03-18T17:06:10.823Z")
- [ ] **Sticky headers** — On long tables, do column headers stay visible when scrolling?
- [ ] **Responsive behavior** — If applicable, does the table adapt to smaller viewports?

#### Detail Views

Navigate to a detail page from a list. Then check:

- [ ] **Back navigation** — Is there an explicit back button or breadcrumb? Click it — does it return to the list with the previous state (page, filters, scroll position)?
- [ ] **Browser back** — Click the browser back button. Does it return to the list? Is the list state preserved (page number, filters)?
- [ ] **Breadcrumbs or context** — Is there a breadcrumb trail or header showing where you are in the hierarchy?
- [ ] **Deep link** — Copy the URL and open in a new tab. Does it load the correct detail?
- [ ] **Related actions** — Are relevant actions visible (edit, delete, duplicate, share)?
- [ ] **Loading state** — Is there a loading indicator while detail data is fetched?
- [ ] **Error / not found** — Navigate to a non-existent ID (e.g., `/items/nonexistent`). Is there a helpful error page?

#### Form Views

Navigate to a form (create or edit). Then check:

- [ ] **Required fields** — Are required fields clearly marked?
- [ ] **Inline validation** — Leave a required field empty and tab/click away. Does validation appear on blur, or only after submit?
- [ ] **Error messages** — Trigger a validation error. Is the message specific (e.g., "Email must include @") or generic ("Invalid input")?
- [ ] **Submit feedback** — Submit the form. Is there clear success feedback (toast, redirect with message)?
- [ ] **Submit error** — If possible, trigger a submit error. Is there clear error feedback with guidance?
- [ ] **Double submit prevention** — Click submit rapidly. Is the button disabled while the request is in-flight?
- [ ] **Cancel / back** — Is there a cancel button? If you've entered data and click cancel or back, does it warn about unsaved changes?
- [ ] **Destructive confirmation** — For delete actions or forms that destroy data, is there a confirmation dialog?

#### Navigation / Global

Check once for the entire application:

- [ ] **Current location** — Is the active page/section clearly indicated in the navigation?
- [ ] **Browser back/forward** — Navigate through 3-4 pages, then use browser back and forward. Does history work correctly?
- [ ] **URL reflects state** — At every point in the app, does the URL represent where you are? Can you share/bookmark it?
- [ ] **No dead ends** — Is there always a way forward or back from every view?
- [ ] **404 page** — Navigate to a non-existent URL. Is there a helpful 404 page?
- [ ] **Mobile viewport** — If applicable, resize to mobile width. Is the navigation accessible? Do views adapt?

### 5. Figma Comparison (Optional)

If a Figma link was provided, use Figma MCP to:

- Compare the implemented views against the design specs
- Flag significant deviations in layout, spacing, component usage
- Note this as a separate section in the report — keep it distinct from the usability checklist

### 6. Generate Report

Format the report following the same pattern as `/melt-audit`:

```markdown
# UX Audit Report

**Project**: {project name}
**Date**: {today's date}
**Audited by**: AI (melt-ux-audit skill)
**Application URL**: {URL audited}

## Summary

| View                   | Pass      | Warn  | Missing |
| ---------------------- | --------- | ----- | ------- |
| /meetings (List)       | 6         | 2     | 3       |
| /meetings/:id (Detail) | 4         | 1     | 2       |
| /meetings/new (Form)   | 5         | 0     | 1       |
| Navigation / Global    | 4         | 1     | 0       |
| **Total**              | **19/30** | **4** | **6**   |

**Overall score**: 19/30 passing (63%)

## Detailed Results

### /meetings — List View

- ✅ Total count displayed — "Showing 24 meetings" visible above table
- ❌ Column labels use DB field names — `created_at` should be "Created", `is_recurring` should be "Recurring"
- ❌ Pagination state not in URL — page 3 resets to page 1 on refresh
- ⚠️ No sticky headers — column context lost when scrolling past 15 rows
  ...

### /meetings/:id — Detail View

- ❌ No back button — only browser back works, and it resets list to page 1
- ❌ Browser back resets list state — was on page 3 with "active" filter, back button goes to unfiltered page 1
  ...

(continue for each view)

## Top Priority Actions

1. **Add back navigation to detail views** — Every detail view needs an explicit back button that returns to the list with preserved state (page, filters). This is the most impactful fix because it affects every user who views a detail and tries to return.
2. **Preserve pagination and filter state in URL** — Use URL search params for page number, sort, and active filters. This fixes both the refresh problem and the back-button problem.
3. **Replace DB field names with human-readable labels** — `created_at` → "Created", `is_recurring` → "Recurring", etc. Quick fix with high impact on readability.
```

### 7. Save and Submit Report

- Print the full report in the conversation
- Write the report to `.audits/YYYY-MM-DD-HHmm-ux-audit.md` (using today's date). Create the `.audits/` directory if it doesn't exist.
- **Submit to Melt Central** (Melt Studio developers only):
  1. Check whether `meltctl` is installed by running `meltctl --version`. If the command isn't found, skip this step silently — the developer isn't a Melt Studio team member and doesn't need this. Don't fall back to `npx`; a missing global CLI is the signal.
  2. If a version prints, submit the report:

     ```bash
     meltctl audit submit .audits/YYYY-MM-DD-HHmm-ux-audit.md
     ```

     - On success, tell the developer: "This audit has been submitted to Melt Central where your team tracks and reviews all audits."
     - If it fails with an authentication error, tell them to run `meltctl login` and retry.
     - For any other error, report the failure so they can debug it.

  Melt Central is a CLI command, not an MCP server. Don't look for it in `.mcp.json` or the `## Tool Connections` section of AGENTS.md — its absence there is not a reason to skip submission.

---

## Extending the Checklist

This checklist is a living document. When recurring issues are discovered across projects, add them here. The goal is that every common mistake gets caught automatically.

To add a new check:

1. Identify the view type it applies to (list, detail, form, navigation, or all)
2. Write it as a testable assertion ("Is X present?" or "Does Y happen when Z?")
3. Add it to the appropriate section above

## Research Sources

The checklist is derived from established UX research:

- **Nielsen Norman Group — 10 Usability Heuristics**: visibility of system status, match between system and real world, user control and freedom, consistency, error prevention, recognition over recall
- **Vitaly Friedman / Smashing Magazine — Smart Interface Design Patterns Checklists**: 402-page component-by-component checklist (tables, forms, navigation, modals)
- **Baymard Institute**: 130,000+ hours of usability testing. Key findings on filter patterns, form layouts, inline validation
- **Four States Model** (Loading / Empty / Error / Content): widely-adopted developer mental model for data-driven views

## Common Issues

### Chrome DevTools MCP not available

In feature mode, fall back to code-only review and note the limitation. In full audit mode, Chrome DevTools MCP is required — help the developer set it up before proceeding.

### App requires authentication

Ask the developer to log in via Chrome DevTools MCP before starting the audit, or to provide test credentials. If the app has different user roles, ask which role to audit as.

### Single-page app with client-side routing

URL checks still apply — modern SPAs should update the URL to reflect state. If the framework doesn't do this by default, flag it as a finding.

### App is not running

The UX audit reviews the live application. If the app isn't running, ask the developer to start it (dev server or preview deployment) before proceeding.
