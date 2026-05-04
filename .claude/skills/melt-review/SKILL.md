---
user-invocable: true
description: >-
  Review code changes against project standards and address PR feedback.
  Use when the developer asks to review changes, check code quality,
  or respond to PR reviewer comments. Categorizes findings as must-fix,
  should-fix, or suggestions.
---

# Review

Facilitate the developer's pre-merge code review. The agent prepares review materials and flags areas for human attention — the developer makes the approve/reject decision. Produces a `## Review Results (Developer)` section in the plan file.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill review 2>/dev/null &
```

## Important

- The agent does NOT approve or reject the code — that is the developer's decision
- Read every changed file completely — don't skim or skip files
- The review brief is preparation for the developer, not a substitute for them reading the diff
- Reject vague sign-offs — if the developer says "looks good" without specifics, push back

## Instructions

0. **Pre-check**
   - Read AGENTS.md. If it contains `[PROJECT_OVERVIEW]` or other placeholder markers, stop and tell the developer to run `/melt-setup` first — reviewing without project standards will miss project-specific issues.
   - Find the plan file for the current work:
     1. Read the current branch name and extract the ticket ID (e.g. `feature/PROJ-123` → `PROJ-123`)
     2. Search `.plans/` for a matching file (e.g. `.plans/*/PROJ-123.md`)
     3. If no match or multiple matches, ask the developer which plan file to use
     4. If no plan file exists, proceed without it — not all work requires a plan (small bugs, chores)
   - If a plan file is found, check that it contains **Validation Results (Agent)** and **Validation Results (Developer)** sections. If either is missing, warn the developer that validation appears incomplete and suggest running `/melt-validate` first. Proceed with the review if they confirm.

1. **Prepare Review Brief**
   - Run `git diff main...HEAD` (or the appropriate base branch) to read all changes
   - Read all modified files completely — don't skim
   - If a plan file exists, read it to understand the approved approach, scope, and PRD alignment
   - Present a review brief to the developer:
     - **Summary** — what changed and why (from plan + diff)
     - **Plan deviations** — anything implemented differently from the approved plan. If everything matches, say so.
     - **Areas for human attention** — complexity, risk, architectural decisions, and things you explicitly cannot evaluate (e.g., "I can't tell whether this mock strategy will hold up as the component evolves," "this touches auth patterns I don't have full context on"). Be honest about the limits of your review.
     - **Standards check** — flag any "No Shortcuts" violations (`eslint-disable`, `@ts-ignore`, `as any`, `--no-verify`), PR size against the 200-400 line guideline, test coverage gaps
     - **PRD alignment** — if the plan has a PRD alignment section, check whether the implementation aligns with the PRD's intent. Flag concerns.

2. **Developer Reviews the Code**
   - Tell the developer to review the diff, pointing them to the flagged areas
   - Suggest they pay particular attention to:
     - The areas you flagged for human attention
     - Any plan deviations you identified
     - Business logic that requires domain knowledge you don't have
   - Wait for them to complete their review

3. **Record Review Decisions**
   - Ask the developer targeted questions based on the changes:
     - Questions about flagged areas (e.g., "Did you review the error handling in the new API route? What's your assessment?")
     - Questions about plan alignment (e.g., "The plan called for incremental migration — does the implementation match your expectations?")
     - If there are standards violations, ask whether they're intentional and justified
   - Ask for their explicit decision: **approve** or **request changes**
   - If the developer requests changes, record what needs to change and stop — they should fix the issues and run `/melt-review` again
   - If the developer's answers are vague (e.g., "it's fine," "looks good"), push back — ask them to describe specifically what they checked and what they think about the flagged areas

4. **Write Review Record**
   - Append a `## Review Results (Developer)` section to the plan file:

     ```
     ## Review Results (Developer)

     ### Review Brief
     - Summary: [1-2 sentence summary of what changed]
     - Plan deviations: [none, or list]
     - Standards violations: [none, or list]

     ### Developer Review
     1. Q: Did you review the error handling in the new API route?
        A: Yes — the retry logic looks correct, but I'd prefer exponential backoff. Acceptable for now.

     2. Q: The plan called for incremental migration — does the implementation match?
        A: Yes, only the shared components were migrated as planned.

     3. Q: Any concerns with the test coverage?
        A: No — the new tests cover the main flows adequately.

     Decision: approved
     ```

   - Update the plan file's YAML frontmatter status to `reviewed`
   - These results need to be committed so they're part of the project record. Ask the developer: "Should I commit the updated plan file now?" If yes, commit with a message like `docs(plan): add review results for TICKET-XXX`. If no, remind them to commit before creating the PR.
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

### Developer skips reading the diff

The review brief is preparation, not a substitute for the developer reading the code. If the developer jumps straight to answering questions without reviewing, remind them that the purpose of this step is for a human to review the actual code changes. The agent's brief highlights areas to focus on, but the developer needs to read the diff themselves.

### No plan file found

Proceed without plan-specific questions. Focus the review on code quality, standards compliance, and test coverage. Note in the review record that no plan was available for scope verification.

### Developer says "looks good" without specifics

Same pattern as developer validation in `/melt-validate`: reject vague answers. Ask the developer to describe specifically what they checked. "Looks good" is not a review — "I checked the error handling and it correctly retries on 5xx responses" is.

### Pre-existing issues in changed files

Only flag issues introduced by the current changes. If you notice pre-existing problems, mention them in the review brief as context but don't ask the developer to address them — fixing unrelated issues belongs in a separate PR.
