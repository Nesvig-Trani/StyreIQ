---
description: Run the validation plan from the plan document after implementation.
---

# Validate

Run the validation plan from the plan document after implementation is complete. Validates the feature end-to-end, suggests test coverage improvements, then prompts the developer for mandatory manual validation.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill validate 2>/dev/null &
```

## Important

- Validation is not just "tests pass." It means verifying the feature works as a user would experience it
- Every item in the validation plan must be checked — don't skip items or mark them as passed without evidence
- If a validation check fails, stop and report it. Do not proceed to developer validation with known failures
- Use browser-based validation (Chrome DevTools MCP) whenever possible, including on preview deployments — don't just check that a URL returns 200

## Instructions

0. **Pre-check**
   - Read AGENTS.md. If it contains `[PROJECT_OVERVIEW]` or other placeholder markers, stop and tell the developer to run `/melt-setup` first.
   - Find the plan file for the current work:
     1. Read the current branch name and extract the ticket ID (e.g. `feature/PROJ-123` → `PROJ-123`)
     2. Search `.plans/` for a matching file (e.g. `.plans/*/PROJ-123.md`)
     3. If no match or multiple matches, ask the developer which plan file to use
   - Read the plan file and locate the **Validation plan** section. If there is no validation plan, tell the developer and ask them to update the plan first.
   - **Check Chrome DevTools MCP availability**: If the validation plan includes any UI or browser-based checks, verify that the Chrome DevTools MCP server is available by attempting to use it. If it is not available:
     - Tell the developer: "The validation plan includes browser-based checks, but Chrome DevTools MCP is not available. Run `/melt-link` to set it up and verify it works. Browser validation is the most reliable way to verify UI features — automated tests alone can miss visual issues, broken flows, and layout problems."
     - If the developer sets it up, proceed with browser validation.
     - If the developer declines or can't install it, acknowledge and proceed without browser checks — but note in the validation results that browser-based validation was skipped and why. Do not silently skip browser checks.

1. **Run Validation Checks**
   - Work through each item in the validation plan
   - Use the right validation method for the type of work. Combine methods for thorough coverage:
     - **UI features** — use Chrome DevTools MCP to interact with the app in a browser (on preview/dev deployment if available, otherwise locally)
     - **API endpoints** — use curl, httpie, or Postman to verify request/response shapes, status codes, and error handling
     - **Data pipelines** — run the pipeline with test data, verify output matches expected results, check logs for errors
     - **Infrastructure changes** — verify resources are provisioned correctly, connectivity works, permissions are set
     - **CLI tools** — run the commands with expected inputs, verify output and exit codes
     - **Automated tests** — run unit, integration, and E2E tests. These complement but do not replace the methods above
   - The validation plan (from Step 1) defines what to check. The method depends on the type of work — but every type of work must be validated
   - For each check, record: what was tested, what method was used, pass or fail, and any evidence (error messages, unexpected behavior)
   - If a check fails, attempt to identify why and report it clearly

2. **Evaluate Test Coverage**
   - Compare the validation plan against the existing test suite
   - Identify acceptance criteria or edge cases that have no automated test coverage
   - For each gap, suggest a specific test: what it should test, where it should live, and what it should assert
   - Ask the developer: "I found N validation items without automated test coverage. Should I write these tests now?"
   - If approved, write the tests and run them to confirm they pass

3. **Record Agent Validation Results**
   - Append a `## Validation Results (Agent)` section to the plan file
   - Use a checklist format with details for each item:

     ```
     ## Validation Results (Agent)

     - [x] Login form renders on /login — verified via Chrome DevTools MCP on preview deploy
     - [x] Valid credentials redirect to /dashboard — verified via Chrome DevTools MCP
     - [x] Invalid credentials show error message — verified via Chrome DevTools MCP
     - [ ] Rate limiting after 5 attempts — FAILED: rate limiter not configured in dev environment
     - [x] All unit tests pass — 23 tests, 0 failures
     - [x] Added 3 new tests for error state validation
     ```

   - If any checks failed, summarize the failures and recommend next steps (go back to implementation, or flag as a known limitation)
   - **If the feature includes UI changes** (new pages, forms, tables, or modified views), remind the developer: "This feature includes UI changes. Consider running `/melt-ux-audit` to check UI completeness (loading/empty/error states, back navigation, URL state, human-readable labels) before proceeding to developer validation."

4. **Developer Validation (Mandatory)**
   - If all agent checks passed (or failures are acknowledged), prompt the developer to validate manually
   - Tell the developer where to access the feature (preview URL or localhost)
   - Generate **3-5 specific observation questions** from the validation plan that can only be answered by actually using the feature. Examples:
     - "What message appears when you submit the form with an empty email field?"
     - "After logging in, what is the first item shown on the dashboard?"
     - "What happens when you click the back button after completing the checkout flow?"
     - "How does the error state look on a mobile viewport?"
   - The questions must be specific enough that a developer cannot answer them without trying the feature
   - Wait for the developer to answer each question
   - If answers are vague (e.g. "it works," "looks good") or don't match expected behavior, push back and ask them to try again or describe what they actually see
   - Once all questions are answered satisfactorily, record the sign-off in the plan file:

     ```
     ## Validation Results (Developer)

     1. Q: What message appears when you submit with an empty email field?
        A: "Email is required" appears in red below the input field

     2. Q: After logging in, what is the first item on the dashboard?
        A: The "Recent Activity" card showing the last 5 actions

     3. Q: What happens when you click back after checkout?
        A: Redirects to the order confirmation page, doesn't re-submit

     Approved: yes
     ```

   - If the developer finds issues, go back to implementation to address them. Do not proceed to review.
   - Once developer approves, update the plan file's YAML frontmatter status to `validated`
   - The validation results need to be committed so they're part of the project record. Ask the developer: "Should I commit the updated plan file now?" If yes, commit with a message like `docs(plan): add validation results for TICKET-XXX`. If no, remind them to commit before running `/melt-review`.
   - **Submit to Melt Central** (Melt Studio developers only):
     1. Check whether `meltctl` is installed by running `meltctl --version`. If the command isn't found, skip this step silently — the developer isn't a Melt Studio team member and doesn't need this. Don't fall back to `npx`; a missing global CLI is the signal.
     2. If a version prints, submit the updated plan:

        ```bash
        meltctl plan submit <plan-file-path>
        ```

        - If it fails with an authentication error, tell the developer to run `meltctl login` and retry.
        - For any other error, note the failure but don't block — the file is still saved locally.

     Melt Central is a CLI command, not an MCP server. Don't look for it in `.mcp.json` or the `## Tool Connections` section of AGENTS.md — its absence there is not a reason to skip submission.

## Common Issues

### Chrome DevTools MCP not available

Do not silently skip browser checks. The pre-check step should have already prompted the developer to install Chrome DevTools MCP. If they declined, fall back to other validation methods: run automated tests, use curl for API endpoints, check logs for expected output. In the validation results, explicitly mark each browser check as **SKIPPED (no Chrome DevTools MCP)** so the developer knows these were not verified. If multiple UI checks were skipped, add a summary note recommending the developer validate these manually in the browser.

### Validation check fails

Stop and report the failure clearly — do not proceed to developer validation with known failures. Include what was expected, what actually happened, and suggest whether to go back to implementation or flag as a known limitation.

### No validation plan in the plan file

Tell the developer the plan file is missing a validation plan section. Ask them to update the plan first — validation without a plan is ad-hoc and may miss acceptance criteria.
