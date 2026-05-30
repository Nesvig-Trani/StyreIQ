# Playbook

Answer questions about the AI-First Development Playbook and team workflow. This is a reference skill — use it when a developer asks how the workflow works, what step they're on, or how a specific part of the process functions.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill help 2>/dev/null &
```

## Important

- This skill answers questions about the workflow. It does NOT execute workflow steps — use the specific skill for that (e.g., `/melt-plan` to plan, `/melt-validate` to validate)
- Base all answers on the playbook content below. Don't invent workflow steps or modify the process
- If the developer's question isn't covered by the playbook, say so and suggest where to find the answer

## The Pipeline

Every feature follows the same pipeline. Each step produces a defined output that feeds the next.

```
Plan → Implement → Agent Validate → You Validate → Review → PR
```

The AI agent does the heavy lifting. You steer, review, and approve at every gate.

### Plan files

Every non-trivial piece of work produces a **Plan Document** stored in the repo:

```
.plans/
  sprint-24/
    TICKET-123.md
    TICKET-456.md
  sprint-25/
    TICKET-789.md
```

This file is the source of truth for the work. It's committed, reviewed, and kept as a record of the thinking behind every change.

## Step 1: Plan

**You get a ticket. Don't touch code. Start with a plan.**

Open your AI editor (Claude Code, Cursor, or OpenCode) and give the agent everything it needs:

### Required input

| Input                   | What to provide                                        |
| ----------------------- | ------------------------------------------------------ |
| **Ticket**              | Full title + description — copy-paste, don't summarize |
| **Acceptance criteria** | The "done" checklist from the ticket                   |
| **Sprint**              | Current sprint identifier (for plan file organization) |

### Strongly recommended input

| Input                | What to provide                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PRD / design doc** | Paste or link the relevant sections. If your story is part of a larger PRD, include the full PRD so the agent (and you) understand where this story fits in the bigger picture |
| **Your context**     | Related files, similar implementations, constraints, things you already know                                                                                                   |

> **With skills:** Type `/melt-plan` and paste the ticket content.
>
> **Without skills:** _"Plan how to implement this. Don't write code yet. Explore the codebase, identify the files to change, and propose an approach. Save the plan to `.plans/<sprint>/TICKET-XXX.md`."_

### Plan Document output

The agent produces a plan file at `.plans/<sprint>/TICKET-XXX.md` with this structure:

| Section                    | Contents                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Requirements summary**   | What the agent understood — catch misunderstandings here                                               |
| **PRD alignment**          | Which PRD sections/goals this story addresses, how it fits the bigger picture. Omit if no PRD provided |
| **Files to modify/create** | Specific paths                                                                                         |
| **Implementation steps**   | Numbered, concrete                                                                                     |
| **Validation plan**        | What to check, what URLs/flows to test, expected behavior. This is agreed on _before_ coding starts    |
| **Edge cases and risks**   | What could go wrong. If this story depends on unmerged work from another story, note it here           |
| **Non-code changes**       | Env vars, migrations, CI config, dependencies                                                          |
| **Open questions**         | Anything ambiguous — resolve before approving                                                          |

### Your job: review the plan

Read it carefully. Push back. Ask "what about X?" Check that the validation plan actually covers the acceptance criteria. If a PRD was provided, verify the agent understood where this story fits.

**Approve the plan.** The agent then creates a working branch (if you're on `main`) following the naming convention — `feature/PROJ-123-short-description`, `fix/PROJ-456-bug-slug`, etc. — and commits the plan file. Then implementation starts.

### When plans change

If you discover something unexpected during implementation:

- **Minor change**: update the plan file in place — the agent adds a "Changes" section noting what shifted and why
- **Major change**: re-plan from scratch. Run `/melt-plan` again for the same ticket and start fresh

## Step 2: Implement

The agent writes code following the approved plan. It references your project's AGENTS.md standards and existing code patterns.

**During implementation:**

- The agent makes incremental changes, running tests and linters as it goes
- It validates continuously against the validation plan (checking its own work as it builds)
- It follows your existing code patterns, not its own preferences

**You stay available** for questions. The agent may ask for clarification on business logic. Answer promptly — a wrong assumption costs more than a quick reply.

### Output

Committed code changes that follow the plan, with tests.

## Step 3: Agent Validates

After implementation is complete, the agent runs a **structured validation pass** against the validation plan from Step 1.

> **With skills:** Type `/melt-validate` — the agent finds the plan file, runs every check, and records results.
>
> **Without skills:** _"Run the validation plan from the plan document. Use Chrome DevTools MCP to test in the browser. Check every item and record pass/fail results in the plan file."_

### Validation methods

Use the right method for the type of work. Combine methods for thorough coverage.

- **UI features** — browser (Chrome DevTools MCP on preview deploy or localhost)
- **API endpoints** — curl, httpie, or Postman
- **Data pipelines** — run with test data, verify output
- **Infrastructure** — verify resources, connectivity, permissions
- **CLI tools** — run commands, verify output and exit codes
- **Automated tests** — always run alongside the above, never as a replacement

### Test coverage expansion

The agent compares the validation plan against existing tests. If acceptance criteria or edge cases lack automated test coverage, the agent suggests and writes new tests. Since the agent writes most of the code, this validation step is where test quality gets enforced.

### Output

The agent appends a **Validation Results** section to the plan file:

```markdown
## Validation Results (Agent)

- [x] Login form renders on /login — verified via Chrome DevTools MCP on preview deploy
- [x] Submitting valid credentials redirects to /dashboard — verified via Chrome DevTools MCP
- [x] Invalid credentials show error message — verified via Chrome DevTools MCP
- [ ] Rate limiting after 5 failed attempts — FAILED: rate limiter not configured in dev
- [x] All unit tests pass — 23 tests, 0 failures
- [x] Added 3 new tests for error state validation
```

## Step 4: You Validate

**This is mandatory. You must see the feature running with your own eyes.**

Open the app — preview URL or localhost — and use the feature as a user would. Don't just verify it "works." Ask yourself:

- Does the flow feel right?
- Did we miss a state? (loading, empty, error)
- Would I be confused as a user?
- Does this match what the PRD describes?

If something's off, send it back to Step 2. Don't proceed to review with a feature that doesn't feel right.

### How it works

The agent generates **3-5 specific questions** from the validation plan that you can only answer by actually using the feature. For example:

- _"What message appears when you submit the form with an empty email field?"_
- _"After logging in, what is the first item shown on the dashboard?"_
- _"What happens when you click the back button after completing the checkout flow?"_

You must answer each question with what you actually see. Vague answers like "it works" or "looks good" don't count — the agent will push back and ask you to describe what you see.

### Output

Your answers are recorded in the plan file as proof of manual validation:

```markdown
## Validation Results (Developer)

1. Q: What message appears when you submit with an empty email field?
   A: "Email is required" appears in red below the input field

2. Q: After logging in, what is the first item on the dashboard?
   A: The "Recent Activity" card showing the last 5 actions

3. Q: What happens when you click back after checkout?
   A: Redirects to the order confirmation page, doesn't re-submit

Approved: yes
```

## Step 5: Review

Now the code gets a thorough review. This covers two dimensions:

### Code quality

- Does the code match the plan? Flag scope creep or missed requirements
- Is the logic correct? Especially business logic and edge cases
- Are there security issues? Injection, auth bypasses, exposed secrets
- Are there tests? New behavior needs new tests
- No shortcuts? No `eslint-disable`, `@ts-ignore`, `any` casts, or skipped hooks

### PRD alignment (when PRD was provided)

- Does the implementation align with the PRD's intent for this area?
- Does it contradict or undermine any broader PRD goals?
- Are there PRD acceptance criteria that this story should partially address but doesn't?

> **With skills:** Type `/melt-review` — the agent reads the plan file, reviews against project standards, checks PRD alignment, and flags issues by severity (Must Fix, Should Fix, Suggestion).
>
> **Without skills:** _"Review all changes for bugs, missing tests, security issues, and standards. Also check that the implementation aligns with the PRD sections listed in the plan document."_

### Output

Review findings categorized by severity. Fix all "Must Fix" items before proceeding.

## Step 6: Pull Request

Everything passes. Create the PR.

The PR skill verifies that both agent and developer validation were completed (recorded in the plan file) before creating the PR. If validation is missing, it will ask you to complete it first.

> **With skills:** Type `/melt-pr` — the agent runs all checks, writes the PR description, and creates it.
>
> **Without skills:** _"Run all checks (build, lint, typecheck, tests) and create a PR with a clear description referencing the ticket."_

### PR standards

- **Title**: under 70 characters, describes what changed
- **Description**: 1-3 bullet summary, link to ticket, note breaking changes
- **Branch name**: `feature/`, `fix/`, `chore/`, or `refactor/` prefix with ticket ID (created during Plan step)
- **Commits**: conventional format — `feat:`, `fix:`, `chore:`, etc.
- **Size**: 200-400 changed lines. Split larger work into stacked PRs

**A human reviewer must approve every PR before merge.** AI wrote it, humans gate it.

### After the PR is created

The PR is not done when it's created. When you get reviewer feedback, run `/melt-pr` again — it detects the existing PR and switches to feedback mode. The agent fetches all comments and presents them to you for triage: for each comment, you decide whether to accept it, push back, or respond. The agent does not implement any changes until you've reviewed all comments and confirmed which ones to act on. The developer who owns the story is responsible for getting the PR merged.

## Fixing Bugs

**Small bugs** (typos, single-file fixes with clear root cause) skip the plan. Go straight to implement → validate → review → PR.

**Complex bugs** (multi-file, unclear root cause, cross-system) get the full pipeline starting from Step 1.

For all bugs:

> **With skills:** Type `/melt-debug` and paste the bug report, error message, or stack trace.
>
> **Without skills:** _"Debug this issue. Find the root cause, write a regression test that fails, then fix it with a minimal change."_

**Key rule:** fix only the bug. No refactoring, no "improvements." Minimal change, maximum confidence.

## Periodic: Project Audit

Run quarterly or before major releases.

> **With skills:** Type `/melt-audit` — produces a structured report covering 15 categories (documentation, testing, CI/CD, security, dependency health, and more).
>
> **Without skills:** Ask the agent to check project compliance against your team standards.

Each gap becomes a ticket. Track and close them over time.

## Periodic: UX Audit

Run on projects with user-facing interfaces to catch basic UI completeness issues.

> **With skills:** Type `/melt-ux-audit` — inspects the live app via Chrome DevTools MCP. Checks list views, detail views, forms, and navigation against a usability checklist (total counts, back buttons, URL state, loading/empty/error states, human-readable labels, etc.).
>
> **Without skills:** _"Review the UI of this app for basic usability issues. Check every table, detail view, and form for missing states, broken navigation, and raw DB labels."_

**Two modes:**

- **Full audit** (no active plan): audits the entire app, produces a report file
- **Feature audit** (during active plan): scopes to the current feature, appends a UX Review section to the plan file

## Periodic: Security Audit

Run quarterly or before compliance reviews. Best run from the infrastructure repository.

> **With skills:** Type `/melt-security-audit` — performs a comprehensive security posture audit across all platform repositories. Covers 13 categories: infrastructure, encryption, auth, application security, network, data protection, secrets, containers, CI/CD, dependencies, monitoring, AI/LLM security, and compliance readiness.
>
> **Without skills:** _"Run a security posture audit. Check infrastructure, encryption, authentication, secrets management, and compliance readiness across all our repositories."_

The skill interviews you for context it can't get from code (pen testing history, compliance targets, IR plans), then uses CLI tools (AWS CLI, Terraform, curl) to verify findings. Produces a report with an executive summary for management and detailed findings for engineering.

## Quick Reference

| Pipeline step  | Skill            | Without skills, tell the agent...                                       |
| -------------- | ---------------- | ----------------------------------------------------------------------- |
| Plan           | `/melt-plan`     | "Plan this. Explore the codebase, propose an approach, save to .plans/" |
| Agent Validate | `/melt-validate` | "Run the validation plan from the plan document using the browser"      |
| Review         | `/melt-review`   | "Review all changes for bugs, tests, security, PRD alignment"           |
| Pull Request   | `/melt-pr`       | "Run all checks and create a PR with a clear description"               |

| Other tasks      | Skill                  | Without skills, tell the agent...                                |
| ---------------- | ---------------------- | ---------------------------------------------------------------- |
| Fix a bug        | `/melt-debug`          | "Debug this. Find root cause, write a failing test, then fix it" |
| Audit project    | `/melt-audit`          | "Audit this project against our team standards"                  |
| UX audit         | `/melt-ux-audit`       | "Review the UI for usability issues using Chrome DevTools"       |
| Security audit   | `/melt-security-audit` | "Run a security posture audit across the platform"               |
| Set up a project | `/melt-setup`          | "Analyze this project and customize AGENTS.md"                   |
| Connect tools    | `/melt-link`           | "Connect my ticket tracker and browser testing tools"            |
| Update tools     | `/melt-update`         | _(Requires skills — run `meltctl project init` to update)_       |

## Ground Rules

1. **AI codes, you review.** Never merge code you haven't read.
2. **Plan first.** Five minutes of planning saves hours of rework.
3. **Give context.** Paste tickets, PRDs, error logs — don't make the agent guess.
4. **See it running.** You must manually validate every feature before it goes to review. The agent will quiz you.
5. **Know your PRD.** Understand where your story fits in the bigger picture. The agent helps, but you own the holistic view.
6. **No shortcuts.** If the agent disables a linter rule or skips a test, push back.
7. **Small PRs.** Break large features into smaller, reviewable chunks.
8. **Commit deliberately.** Stage with `git add -p`, review diffs, use conventional commits.

## Common Questions

### "What step am I on?"

Check your current state:

- No plan file exists for your ticket → you're at Step 1 (Plan)
- Plan file exists but still on `main` → plan approved, but the working branch wasn't created yet. Create the branch before implementing (see branch naming in Step 1)
- Plan file exists, on a feature branch, no code changes yet → you're between Step 1 and Step 2 (plan approved, ready to implement)
- Code changes exist, no validation results in plan file → you're at Step 3 (Agent Validate)
- Agent validation results exist, no developer validation → you're at Step 4 (You Validate)
- Developer validation approved → you're at Step 5 (Review) or Step 6 (PR)

### "When can I skip the plan?"

Small bugs with a clear root cause (typos, single-file fixes). Everything else gets a plan — even "quick" features, because five minutes of planning saves hours of rework.

### "What if I don't have a PRD?"

The PRD is strongly recommended but not required. Without a PRD, the plan document omits the PRD alignment section. The pipeline works the same way — you just lose the alignment check during review.

### "Do I have to validate manually every time?"

Yes. Developer validation (Step 4) is mandatory. The agent can confirm "the button exists and is clickable" but can't judge "this flow feels right" or "a user would be confused here."

### "What goes in the plan file?"

Requirements summary, PRD alignment (if PRD provided), files to modify/create, implementation steps, validation plan, edge cases/risks, non-code changes, and open questions. After implementation, agent and developer validation results are appended.

### "How do I update a plan that changed during implementation?"

Minor change: update the plan file in place — add a "Changes" section noting what shifted and why. Major change: re-plan from scratch by running `/melt-plan` again for the same ticket.

### "What are the ground rules?"

1. AI codes, you review — never merge code you haven't read
2. Plan first — five minutes of planning saves hours of rework
3. Give context — paste tickets, PRDs, error logs; don't make the agent guess
4. See it running — manually validate every feature before review
5. Know your PRD — understand where your story fits in the bigger picture
6. No shortcuts — push back if the agent disables a linter rule or skips a test
7. Small PRs — break large features into smaller, reviewable chunks
8. Commit deliberately — stage with `git add -p`, use conventional commits

### "Where are plan files stored?"

In `.plans/<sprint>/TICKET-XXX.md` — organized by sprint to prevent a single directory from growing indefinitely. They're committed to the repo as a permanent record of the thinking behind every change.
