# Plan

Design an implementation approach before writing code. Produces a plan document at `.plans/<sprint>/TICKET-XXX.md`.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill plan 2>/dev/null &
```

## Instructions

0. **Pre-check**
   - Read AGENTS.md. If it contains `[PROJECT_OVERVIEW]` or other placeholder markers, stop and tell the developer to run `/melt-setup` first — planning without project context will produce generic results.
   - Check the `## Tool Connections` section. If the ticket tracker is not connected (unchecked), tell the developer: "Your ticket tracker isn't connected. Run `/melt-link` to set it up — this lets me read stories directly instead of relying on copy-paste." Don't block — proceed if the developer provides the ticket content manually.
   - Ask the developer for:
     - **Sprint identifier** (e.g. sprint-24, sprint-12)
     - **Ticket ID** (e.g. PROJ-123 — whatever the project's tracker uses)
   - Check if `.plans/<sprint>/TICKET-XXX.md` already exists. If it does, ask: "A plan already exists for this ticket. Do you want to update it or start fresh?"

1. **Requirements Triage** — stay in conversational mode, do NOT enter plan mode yet
   - Read the full ticket/story the developer provided. If they provided a PRD, RFC, or design document, read it fully.
   - Assess whether the input is sufficient to produce a good plan. Evaluate against these criteria:
     - **Objective** — Is there a clear _why_? ("We need concurrent rendering for the new dashboard" vs just "update React")
     - **Scope** — Is it clear what's in and what's out? ("Migrate the app shell and shared components; leave page-level components for follow-up")
     - **Acceptance criteria** — How will we know it's done? ("All existing tests pass, no console deprecation warnings, Lighthouse score doesn't regress")
     - **Context documents** — For non-trivial work, is there a PRD, RFC, design doc, or at least a detailed ticket?
   - **If the input is rich enough** (has objective, scope, and acceptance criteria, or links a PRD/RFC) — proceed to step 2.
   - **If the input is thin but the task is small** (single component, isolated change, low risk) — proceed to step 2, but note your assumptions explicitly so the developer can correct them.
   - **If the input is thin and the task is significant** (migration, architectural change, multi-file refactor, new system) — push back before entering plan mode:
     - Acknowledge what you understood from the request
     - List specifically what's missing — not a generic "can you tell me more?"
     - Explain _why_ each gap matters for planning (e.g. "Without knowing the acceptance criteria, I might plan a big-bang migration when you actually want an incremental approach")
     - Ask targeted questions to fill the gaps
   - Only proceed to step 2 once you have enough context to plan effectively.

2. **Explore the Codebase** — enter plan mode now (Claude Code: use the plan tool; Cursor/OpenCode: enter plan mode). Stay in plan mode for steps 2–5 — do not write any code.
   - Find relevant files and understand existing patterns
   - Check Reference Examples in AGENTS.md for patterns to follow
   - Identify files that will need changes

3. **Design the Approach**
   - Break the task into concrete implementation steps
   - Consider edge cases and error handling
   - Note any dependencies or ordering constraints between steps
   - If this story depends on unmerged work from another story, note it as a risk
   - Estimate which files will be created or modified
   - Identify non-code changes: database migrations, infrastructure updates, environment variables, CI/CD changes, new dependencies
   - Include how to verify each step (reference Verification Commands in AGENTS.md)

4. **Design the Validation Plan**
   - Define how to verify the feature works end-to-end, not just that tests pass
   - For each acceptance criterion, specify: what to check, how to check it, and expected behavior
   - Cover the happy path, error states, and edge cases
   - Choose validation methods appropriate to the type of work:
     - UI features → browser (Chrome DevTools MCP on preview deploy or localhost)
     - API endpoints → curl, httpie, or Postman
     - Data pipelines → run with test data, verify output
     - Infrastructure → verify resources, connectivity, permissions
     - CLI tools → run commands, verify output and exit codes
   - Automated tests complement but do not replace the above — always include both
   - A good validation plan is specific: "Navigate to /login, submit invalid credentials, verify error message appears" or "POST /api/users with missing email field, verify 422 response with validation error" — not "test that it works"
   - A bad validation plan only covers the happy path or is too vague to execute
   - **If the feature involves UI views** (lists, detail pages, forms), add a validation item: "Run `/melt-ux-audit` to verify UI completeness (loading/empty/error states, back navigation, URL state preservation, human-readable labels)"

5. **Present the Plan**
   - Present the complete plan in the conversation for developer review
   - Structure it with these sections:
     - **Requirements summary** — what you understood from the ticket
     - **PRD alignment** — which PRD sections/goals this story addresses, how it fits the bigger picture (omit if no PRD was provided)
     - **Files to modify/create** — specific paths with brief description of changes
     - **Implementation steps** — numbered, concrete
     - **Validation plan** — the checks from step 4
     - **Edge cases and risks** — what could go wrong, dependencies on unmerged work
     - **Non-code changes** — env vars, migrations, CI, dependencies
     - **Open questions** — anything unresolved

6. **Wait for Approval**
   - Do not proceed until the developer approves the plan
   - Adjust based on feedback — update any section as needed
   - Once approved, exit plan mode

7. **Create the Working Branch**
   - Check the current branch (`git branch --show-current`). If the developer is already on a correctly named feature branch for this ticket, skip branch creation.
   - If the developer is on `main` (or the project's default branch), create a new branch before committing anything:
     - Derive the branch name from the ticket ID and a short slug of the task: `<prefix>/<ticket-id>-<slug>`
     - Choose the prefix based on the type of work: `feature/` for new features, `fix/` for bugs, `chore/` for maintenance, `refactor/` for refactors
     - Example: `feature/PROJ-123-user-onboarding`, `fix/PROJ-456-login-redirect`
     - Present the suggested branch name and confirm with the developer before creating it
   - Create and switch to the branch: `git checkout -b <branch-name>`

8. **Write and Commit the Plan**
   - Write the plan to `.plans/<sprint>/TICKET-XXX.md`
   - Create the `.plans/<sprint>/` directory if it doesn't exist
   - Include YAML frontmatter at the top of the plan file with status and metadata:
     ```
     ---
     status: approved
     ticket: PROJ-123
     sprint: sprint-24
     ---
     ```
   - Set status to `approved` when writing (the developer just approved it)
   - If updating an existing plan, add a `## Changes` section at the bottom noting what changed and why
   - The plan file needs to be committed so it's part of the project record. Ask the developer: "Should I commit the plan file now?" If yes, commit with a message like `docs(plan): add plan for TICKET-XXX`. If no, remind them to commit before starting implementation.
   - **Submit to Melt Central** (Melt Studio developers only):
     1. Check whether `meltctl` is installed by running `meltctl --version`. If the command isn't found, skip this step silently — the developer isn't a Melt Studio team member and doesn't need this. Don't fall back to `npx`; a missing global CLI is the signal.
     2. If a version prints, submit the plan:

        ```bash
        meltctl plan submit <plan-file-path>
        ```

        - If it fails with an authentication error, tell the developer to run `meltctl login` and retry.
        - For any other error, note the failure but don't block — the file is still saved locally.

     Melt Central is a CLI command, not an MCP server. Don't look for it in `.mcp.json` or the `## Tool Connections` section of AGENTS.md — its absence there is not a reason to skip submission.

9. **Post Plan to Ticket Tracker**
   - Check the `## Tool Connections` section in AGENTS.md. If the ticket tracker is not connected (unchecked), skip this step silently — the plan is already saved locally and committed.
   - If connected, post the full plan content as a comment on the ticket using the ticket ID from the plan's YAML frontmatter:
     - **Linear**: Use the Linear MCP `save_comment` tool to post the plan as a comment on the issue. Look up the issue by its identifier (e.g., `PROJ-123`).
     - **GitHub Issues**: Run `gh issue comment <number> --body "<plan-content>"` to post the comment. Extract the issue number from the ticket ID.
     - **Jira**: Use the Jira MCP to add a comment on the ticket.
   - After posting, ask the developer: "Should I also move the ticket to 'In Progress'?" If yes:
     - **Linear**: Use the Linear MCP `save_issue` tool to update the issue status to "In Progress" (or the equivalent active state in the team's workflow).
     - **GitHub Issues**: Add an "in-progress" label if the project uses labels for status tracking. If not, skip — GitHub Issues has no built-in status.
     - **Jira**: Use the Jira MCP to transition the ticket to "In Progress".
   - If posting or status update fails (permissions, network, MCP error), warn the developer but don't block — the plan file is already committed locally. Suggest running `/melt-link` if the MCP connection appears broken.

## Common Issues

### Developer provides a one-liner for a complex task

Don't accept thin requirements for significant work. A developer saying "upgrade React 16 to React 19" hasn't given you enough to plan — you don't know why they're upgrading, what the scope is, or how they'll know it's done. Ask for the objective, scope, and acceptance criteria before entering plan mode. A plan built without understanding _why_ will optimize for the wrong outcome.

### Requirements are unclear or incomplete

Do not guess at business logic. Ask the developer to clarify with the PM or client before planning. A plan built on assumptions will need to be redone.

### Codebase is unfamiliar

Spend more time in step 2 (Explore the Codebase). Read similar features that already exist. Check Reference Examples in AGENTS.md. If the codebase has no similar patterns, note this as a risk in the plan.

### Plan becomes outdated during implementation

Minor changes: update the plan file in place and add a `## Changes` section. Major changes (new requirements, wrong assumptions discovered): re-plan from scratch — run `/melt-plan` again for the same ticket.
