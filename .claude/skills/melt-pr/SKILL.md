---
user-invocable: true
description: >-
  Create a well-structured pull request from current changes. Use when
  the developer is ready to submit work, says "create a PR", or "open
  a pull request". Analyzes changes, runs pre-flight checks, drafts
  description, and creates the PR via gh CLI.
---

# Pull Request

Create a pull request or address feedback on an existing one. If the current branch already has an open PR, switches to feedback mode to fetch and resolve reviewer comments.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill pr 2>/dev/null &
```

## Important

- Do not create the PR if validation is incomplete — both agent and developer validation must be recorded in the plan file
- Do not create the PR if the developer review is incomplete — check for `## Review Results (Developer)` in the plan file
- Do not create the PR if pre-flight checks (tests, lint, typecheck, build) fail
- All agent-produced code must be reviewed by a human before merge — remind the developer

## Instructions

0. **Pre-check**
   - Read AGENTS.md. If it contains `[PROJECT_OVERVIEW]` or other placeholder markers, stop and tell the developer to run `/melt-setup` first — PR descriptions need project context.
   - Find the plan file for the current work:
     1. Read the current branch name and extract the ticket ID (e.g. `feature/PROJ-123` → `PROJ-123`)
     2. Search `.plans/` for a matching file (e.g. `.plans/*/PROJ-123.md`)
     3. If no match or multiple matches, ask the developer which plan file to use
     4. If no plan file exists, proceed without it — not all work requires a plan (small bugs, chores)
   - If a plan file is found, read it. Check that it contains **Validation Results (Agent)**, **Validation Results (Developer)**, and **Review Results (Developer)** sections. If any are missing, tell the developer which steps haven't been completed and suggest running `/melt-validate` or `/melt-review` first.
   - Run `gh pr view --json number,url,state` to check if a PR already exists for this branch.
     - If **no PR exists** → proceed to step 1 (Create PR flow)
     - If **a PR exists** and `state == "OPEN"` → skip to step 5 (Address PR Feedback)
     - If **a PR exists** and `state == "MERGED"` → skip to step 8 (Mark Plan Completed)
     - If **a PR exists** and `state == "CLOSED"` (not merged) → tell the developer the PR was closed without merging and stop. No status change is appropriate.

1. **Analyze Changes**
   - Run `git diff` to understand all changes
   - Run `git log` to review commit history on this branch
   - If a plan file exists, compare the changes against the plan — note any deviations
   - Identify the purpose and scope of the changes
   - Verify branch name follows conventions (`feature/`, `fix/`, `chore/`, `refactor/`)
   - Verify commits use conventional format (`feat:`, `fix:`, `chore:`, etc.)
   - If changes exceed 1,000 lines, warn the developer before proceeding

2. **Draft PR Description**
   - Check for a PR template in the repo before writing the description. Look in this order and use the first match:
     1. `.github/pull_request_template.md` (or `PULL_REQUEST_TEMPLATE.md`)
     2. `.github/PULL_REQUEST_TEMPLATE/*.md` (pick the most relevant one if multiple exist, or ask the developer)
     3. `docs/pull_request_template.md`
     4. `pull_request_template.md` at the repo root
   - If a template is found, check it covers these essential sections: (a) summary/description of changes, (b) testing — how changes were verified, (c) related issues/tickets. If any are missing, warn the developer: list the missing sections, suggest they update their template, but proceed using their template as-is — do not silently inject extra sections.
   - If a template is found and covers the essentials, follow its exact structure — keep all headings, comments, and checkboxes, and fill in each section with content from the changes. Do not invent extra sections the template doesn't have.
   - If no template is found, use this default structure: 1-3 bullet summary, related issues/tickets, testing evidence, breaking changes or migration steps.
   - Write a clear title (under 70 characters)
   - If a plan file exists with a PRD alignment section, include a brief note on which PRD goals this PR addresses (add it under the most appropriate template section, or as a new section only if no template exists)

3. **Run Pre-flight Checks**
   - Run the test suite and verify all tests pass
   - Run the linter and fix any issues
   - Run type checking and resolve any errors
   - Verify the build succeeds

4. **Create the PR**
   - Use `gh pr create` with the drafted title and description
   - Add appropriate labels if the project uses them
   - Request reviewers if specified
   - Return the PR URL to the developer
   - Update ticket/issue status after creating the PR
   - Remind the developer to review before merging — never merge without human review and approval

5. **Fetch PR Feedback** (only when a PR already exists)
   - Fetch inline review comments: `gh api repos/{owner}/{repo}/pulls/{number}/comments`
   - Fetch general PR conversation comments: `gh pr view --comments`
   - If no unresolved comments exist, tell the developer the PR has no pending feedback and stop

6. **Triage Comments with Developer**
   - Present each comment to the developer with context: reviewer name, file/line, what they're asking, and the relevant code
   - For each comment, ask the developer:
     - "Do you agree with this feedback?"
     - If yes: "How would you like to address it?" — the reviewer's suggestion may not be the best approach. Discuss the implementation with the developer before changing anything
     - If no: "How should we respond to the reviewer?" — draft a reply explaining the reasoning, let the developer review it before posting
   - Do NOT start implementing changes until the developer has triaged all comments and confirmed which ones to act on
   - Some comments may be questions or observations that don't require code changes — identify these and draft responses for the developer to approve

7. **Implement Agreed Changes**
   - Only make changes the developer approved in the triage step
   - For each change, follow the reviewer's intent but use the implementation approach the developer agreed on
   - Run pre-flight checks again (tests, lint, typecheck, build) to verify nothing broke
   - Commit the fixes and push
   - Reply to each resolved comment on the PR to let the reviewer know it's been addressed — let the developer review replies before posting

8. **Mark Plan Completed** (only when the PR is already merged)
   - This branch closes the audit trail: the work shipped, so the plan file's `status` should flip to `completed`. Without it, plan files stay at `validated` forever and we can't tell shipped work apart from approved-but-stalled work.
   - If no plan file exists for this branch, tell the developer there's nothing to mark and stop — small bugs and chores legitimately have no plan.
   - Read the plan file's YAML frontmatter:
     - If `status: completed` → already done; tell the developer and stop
     - If `status: validated` → expected state; confirm with the developer ("Mark `<plan-file>` as completed?") and proceed on yes
     - If `status: draft` or `status: approved` → the plan never went through `/melt-validate`, so we're skipping a gate. Warn the developer: "This plan was never validated. Mark completed anyway, or run `/melt-validate` first?" Proceed only on explicit confirmation.
   - On confirmation: rewrite the frontmatter `status` value to `completed` (preserve every other key — `ticket`, `sprint`, anything else). Do not edit the plan body.
   - Commit on `main` with `chore(plan): mark <ticket> plan completed` and push. The plan file lives in `.plans/`, which is checked into the repo, so this becomes part of the project record.
   - **Re-submit to Melt Central** (Melt Studio developers only): run `meltctl plan submit <plan-file-path>` so the dashboard sees the updated status. Same rules as `/melt-plan` step 8 — silently skip if `meltctl` isn't installed; surface an auth error if the developer needs to re-login; don't block on other errors.

## Common Issues

### gh CLI not installed or not authenticated

If `gh` is not available, suggest installing it (`brew install gh` on macOS, or see https://cli.github.com/) and authenticating (`gh auth login`). Offer to run the installation. If the developer declines, provide the PR description as markdown they can paste manually.

### No changes to commit

If `git diff` and `git status` show no changes, the work may already be committed. Check `git log` for recent commits on the branch. If the branch has commits ahead of main, proceed with creating the PR from those commits.

### Pre-flight checks fail

Do not create the PR if tests, lint, or type checking fail. Fix the issues first. If a failure is a known flaky test or pre-existing issue, note it in the PR description and ask the developer whether to proceed.
