---
user-invocable: true
description: >-
  Analyze the project and customize AGENTS.md for this codebase.
  Use when setting up a new project, after running meltctl init,
  or when AGENTS.md has placeholder markers. Detects tech stack,
  fills in project-specific sections, and merges existing standards.
---

# Setup

Analyze the project and customize AGENTS.md for this codebase.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill setup 2>/dev/null &
```

## Important

- Read the codebase thoroughly before writing anything — understand existing patterns first
- Verify every command you add to Verification Commands actually exists in the project
- Preserve universal sections word-for-word — only customize the project-specific parts

## Instructions

1. **Check Current State**
   - Run `git status` to check for uncommitted changes. If the working tree is dirty, ask the developer to commit or stash their changes before proceeding — setup modifies multiple files and the changes should be in their own commit.
   - If AGENTS.md exists with `[PLACEHOLDER]` markers → fill them in (steps 2-5)
   - If AGENTS.md exists without placeholders → enhance it — add missing sections, don't overwrite custom content
   - If AGENTS.md doesn't exist → create the complete file using the structure in step 6

2. **Read the Codebase**
   - Read package.json, composer.json, Gemfile, Cargo.toml, go.mod, or equivalent
   - Read README.md or similar documentation
   - Scan the project structure (top-level directories, key source files)
   - Read existing CLAUDE.md or .cursorrules if present
   - Check for structured documentation directories (e.g., `docs/requirements/`, `docs/technical-design/`, `docs/adr/`)
   - Check for monorepo/workspace indicators:
     - `package.json` with `workspaces` field (Yarn/npm/pnpm)
     - `turbo.json` (Turborepo), `pnpm-workspace.yaml`, `lerna.json`, `rush.json`
     - Multiple `pyproject.toml`, `go.mod`, or `Cargo.toml` at different directory levels
   - If monorepo detected: read each workspace's manifest to map its purpose and tech stack

3. **Detect Tech Stack**
   - Language(s) and runtime version
   - Framework (Next.js, Laravel, Rails, FastAPI, etc.)
   - Test runner (vitest, jest, pytest, phpunit, etc.)
   - Linter/formatter (eslint, prettier, rubocop, etc.)
   - Build tool (webpack, vite, turbopack, esbuild, etc.)
   - Database and ORM if applicable
   - Package manager (yarn, npm, pnpm, composer, bundler, etc.)

   For monorepos, detect the tech stack **per workspace** — each package may use different frameworks, test runners, or build tools. Note which workspaces are deployable services vs shared libraries vs CLI tools. Also scan workspace scripts for migration commands (prisma migrate, alembic, drizzle-kit) and dev servers (next dev, vite dev, uvicorn).

   Note: The appendix standards below have detailed patterns for **JavaScript/TypeScript** (React, Next.js) projects. For other stacks (Laravel, Rails, Go, Python, etc.), generate verification commands and architecture standards from the project's own config and conventions — the universal sections (Code Quality, Security, etc.) still apply.

**Important**: The sections below marked "universal" (Code Quality, Security, No Shortcuts, Pull Requests, Agent Permissions, Agent Behavior, Tool Access, Workflow Skills) must be preserved **word-for-word** from the template or step 6 structure. You may add project-specific bullets to these sections, but never remove, rephrase, or summarize existing content. Only the placeholder sections (Project Overview, Verification Commands, Architecture Standards, Reference Examples) should be fully replaced with project-specific content.

4. **Fill In / Create Sections** (customize project-specific parts, preserve universal sections verbatim)
   - **Project Overview**: 1-2 sentence description with key technologies. Example: "Acme Dashboard — a Next.js 15 + Payload CMS app for managing customer orders, deployed on Vercel."
   - **Verification Commands**: actual commands from project scripts (typecheck, lint, test single file, test all, build). Verify each command exists in the project's scripts/config before including it — don't guess. For monorepos, use two tiers: root-level commands that run across all packages, then per-workspace commands with the directory or workspace filter noted. Include migration and dev server commands in the appropriate workspace section. Example:

     ```
     ### All packages (from root)
     - Build: `yarn build`
     - Test: `yarn test`

     ### packages/web
     - Dev: `yarn workspace @acme/web dev`
     - Migrate: `cd packages/web && npx prisma migrate dev`
     ```

   - **Architecture Standards**: based on actual project patterns. Describe the architecture you see, not generic defaults. Include naming conventions, directory structure, key patterns. If React is detected, include the "React Standards" appendix. If Next.js is detected, also include the "Next.js Standards" appendix — but skip Next.js patterns for React-only projects (Vite, CRA, etc.). For monorepos, add a "Workspace Boundaries" subsection listing each workspace with its purpose, tech stack, and deployment target — e.g., `packages/api/` — Hono API (deployed on AWS Lambda).
   - **Default Workflow**: if the project has structured documentation directories (requirements, specs, ADRs), insert a step after step 0 (understand the story) and before step 1 (read relevant files) telling agents to check those locations — e.g., "Check `docs/requirements/` and `docs/technical-design/` for existing specs".
   - **Reference Examples**: 3-5 files that best demonstrate the project's preferred patterns. Format: `- New [thing]: follow the pattern in \`path/to/file\``. If the codebase has legacy code alongside modern patterns, also include anti-pattern entries: `- Avoid: \`path/to/legacy/file\` (reason, e.g. "class-based, being migrated")`

5. **Merge Existing Standards**
   - If CLAUDE.md, .cursorrules, or similar convention files exist, add a cross-reference line under Project Overview (e.g., `See also: CLAUDE.md for project-specific conventions`)
   - Read those files and merge unique project-specific standards into AGENTS.md
   - Don't duplicate rules already covered by universal sections
   - Don't modify the original convention files

6. **Create from Scratch (when no AGENTS.md exists)**
   - Use this structure for new files:

   ```markdown
   # AGENTS.md

   ## Project Overview

   [filled from step 4]

   ## Verification Commands

   [filled from step 4]

   ## Architecture Standards

   ### Important: Respect Existing Code

   Before applying any standards below, **understand the existing project structure first**. If the project already follows a different architecture or pattern, continue following the existing conventions. These standards apply to new code in greenfield areas — never refactor or restructure existing code to match these guidelines unless explicitly asked.

   [project-specific architecture from step 4]

   ### Code Quality

   - Comments explain **why**, not what — document business logic decisions, workarounds, and non-obvious behavior. Never comment obvious code.
   - Extract magic numbers and strings into named constants
   - Handle all UI states: loading, error, and empty — not just the happy path
   - Never explicitly return HTTP 500 errors — let unhandled errors bubble up to the error handler

   ### Security

   - Never hardcode secrets, API keys, or credentials — use environment variables
   - Never commit `.env` files or files containing secrets
   - Sanitize all user input at system boundaries
   - When adding dependencies, verify they are well-maintained and not deprecated

   ### No Shortcuts

   Never bypass checks to make code work faster. If something fails, fix the root cause — don't silence it. These all require explicit developer approval before using:

   - `eslint-disable` or `@ts-ignore` / `@ts-expect-error`
   - `as any`, `as unknown as X`, or other type assertions to suppress errors
   - `--no-verify` on git commits (skipping pre-commit hooks)
   - `--force` flags on install or build commands
   - Disabling or weakening TypeScript strict mode settings
   - Skipping tests to make CI pass

   If a lint rule or type error is blocking you, explain the issue and ask the developer — don't disable the check.

   Also avoid these common agent pitfalls:

   - **No brute-force fixes**: Never increase timeouts, retries, or memory limits to make something work. Diagnose the root cause.
   - **No scope creep**: Do not refactor or "improve" code unrelated to your current task. If you notice something worth fixing, note it but don't change it.
   - **No excessive mocking**: Tests should exercise real code paths. Only mock external services, network calls, and system boundaries — never mock the code under test.
   - **No compatibility shims**: Don't add wrapper functions or adapter layers to avoid changing callers. If an interface needs to change, change all callers.

   ### Testing

   - Co-locate test utilities and fixtures with the tests that use them
   - Run the project's configured test runner
   - Use descriptive test names that explain the scenario

   ### Pull Requests

   - One concern per PR — don't refactor surrounding code while implementing a feature. If cleanup is needed, do it in a separate PR.
   - When adding code to an existing file, match the patterns already in use (error handling, naming, structure)
   - Aim for 200-400 changed lines per PR; avoid exceeding 1,000 lines. Exception: large refactors may exceed this when the changes are mechanical and reviewable.
   - Stage changes deliberately (`git add -p`) — never blindly `git add .` without reviewing what's being staged
   - Make small, atomic commits — each commit should represent one logical change
   - Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
   - Use branch prefixes: `feature/`, `fix/`, `chore/`, `refactor/` (e.g., `feature/42-user-onboarding`)
   - Default merge strategy: **rebase and merge** with branch deletion
   - Reference issue/ticket IDs in branch names, commit messages, and PR title/description
   - Update ticket/issue status when starting and completing work
   - All agent-produced code must be reviewed by a developer — never merge a PR without human review and approval
   - The developer who owns the story owns the PR until merge — follow up on open PRs, respond to review feedback, don't let PRs go stale

   ## Agent Permissions

   **Auto-approved**: Reading files, running tests/linters/builds, git read operations, searching code, dependency lookups.
   **Requires approval**: Writing/modifying files, git write operations, installing/removing dependencies, creating PRs/issues, database writes.
   **Blocked**: `git push --force`, `git reset --hard`, recursive deletes of root paths, force push to main/master, dropping production database tables, modifying CI/CD files without explicit request.

   ## Agent Behavior

   ### Default Workflow

   For any non-trivial change (multi-file or unfamiliar code): 0. Understand the story — read the full ticket/story and linked PRD before starting. If requirements are unclear, the developer should clarify with the PM or client first.

   1. Read relevant files first — do not code until you understand existing patterns
   2. Outline your approach for significant changes
   3. Implement in small steps, one logical change at a time
   4. Verify after each step — run typecheck, lint, and tests before moving on

   ### Context Efficiency

   - Prefer single-file operations over full-project commands
   - Scope searches narrowly — read specific files rather than entire directories
   - For large investigations, use subagents to keep the main context clean

   ### Session Handoff

   - Never leave the codebase in a broken intermediate state
   - When completing a multi-step task, summarize what was done and what remains
   - Ensure all changes build and pass tests before ending a session

   ## Tool Access

   - Use available tools proactively: `gh` CLI for GitHub, Chrome DevTools MCP for browser testing, AWS CLI for infrastructure, database clients for queries
   - Set up MCP servers for your team's tools so agents can access them directly

   ## Tool Connections

   Status of required integrations. If any are disconnected, run `/melt-link` to set up.

   - [ ] Ticket tracker — not connected
   - [ ] Browser testing — not connected

   ## Workflow Skills

   The following workflows are available as AI skills. When a developer asks you to plan, review, create a PR, or debug — suggest using the corresponding skill for a structured approach instead of doing it ad-hoc.

   - **/melt-setup** - Analyze the project and customize AGENTS.md for this codebase
   - **/melt-link** - Connect and verify required integrations (ticket tracker, browser testing) so other skills work at full capacity
   - **/melt-plan** - Gather requirements, explore codebase, design approach, write plan to `.plans/<sprint>/TICKET-XXX.md`
   - **/melt-validate** - Run the validation plan from the plan document, verify with browser, suggest new tests, prompt developer for manual sign-off
   - **/melt-review** - Prepare review brief, facilitate developer code review, record review decisions in plan file
   - **/melt-pr** - Create PR or address reviewer feedback on existing PR. Triages comments with developer before implementing changes
   - **/melt-debug** - Investigate issues, isolate root cause, write regression test, fix
   - **/melt-audit** - Run a project compliance audit against team standards
   - **/melt-ux-audit** - Review UI against usability heuristics via Chrome DevTools MCP. Full project audit or feature-scoped during active plans
   - **/melt-security-audit** - Run a security posture audit across the entire platform — infrastructure, encryption, auth, data protection, and compliance readiness
   - **/melt-update** - Update Melt skills and standards to the latest version
   - **/melt-help** - Answer questions about the AI-First Development Playbook and team workflow

   ## Reference Examples

   [filled from step 4]
   ```

7. **Clean Up**
   - Remove all `<!-- ... -->` HTML comments from AGENTS.md
   - Remove all `[PLACEHOLDER]` and `[PROJECT_OVERVIEW]` markers
   - Aim for ~150 lines; monorepos with multiple stacks may need more

8. **Present Summary and Commit**
   - Show what was detected (tech stack, framework, test runner, etc.)
   - List the sections that were created or updated
   - Highlight anything that needs manual review or adjustment
   - Commit the changes with a message like `chore: configure project standards via melt-setup`. Stage only the files that were modified (AGENTS.md and any merged convention files). Do not ask for permission — these are project configuration changes that should always be committed.
   - After committing, check the `## Tool Connections` section in AGENTS.md. If any connections are unchecked, tell the developer: **"Next step: run `/melt-link` to connect your ticket tracker and browser testing tools. These are needed for `/melt-plan` and `/melt-validate` to work at full capacity."**

## Common Issues

### No package.json or manifest file

The project may use a non-standard build system or be a polyglot repo. Look for `Makefile`, `Taskfile.yml`, `justfile`, or CI config to understand the build process. Generate Verification Commands from whatever build system exists.

### AGENTS.md is heavily customized

If the developer has added significant custom content beyond the template structure, preserve all custom sections. Only update universal sections if explicitly asked — don't overwrite thoughtful customizations with template defaults.

### Monorepo with multiple stacks

If you detected workspace indicators in step 2, follow the monorepo-specific guidance in steps 3-4: per-workspace tech stack detection, tiered verification commands, workspace boundary documentation, and migration/dev server command detection. The final AGENTS.md may exceed 150 lines for complex monorepos — that's acceptable.

## Appendix: React Standards

These are **Melt's preferred defaults for domain-driven React apps**. Include them when React is detected (with or without Next.js), but adapt for the framework: file-based routing frameworks (Next.js App Router, TanStack Router, Remix) define their own structure — don't force domain folders onto a routes-based project. For existing projects, **skip any pattern that conflicts with the project's existing structure** (e.g., co-located tests vs `__tests__/`, flat components vs folders with `index.tsx`). For greenfield projects, use these as starting defaults but let the framework's conventions take precedence.

### Architecture

For new frontend code, prefer domain-driven architecture:

- Each domain is self-contained with its own components, hooks, schemas, types, and utils
- Each domain exposes a public API via a barrel `index.ts` — external consumers import from the barrel, never deep-import internal files
- Cross-domain imports go through a `shared/` directory — never import directly between domains
- All external API communication goes through hooks (e.g., `hooks/services/`) — no separate `services/` directory
- Centralize UI permission logic in a `permissions/` directory — never hardcode role checks in components
- Define Zod schemas at system boundaries and infer types from them (`z.infer<>`)
- For domains with many components, consider grouping into sub-directories (e.g., `cards/`, `forms/`, `tables/`)

### Naming Conventions

- **Folders**: `kebab-case` (e.g., `user-profile/`, `order-history/`)
- **Component files**: `PascalCase.tsx` (e.g., `UserCard.tsx`, `OrderList.tsx`)
- **Logic files**: `camelCase.ts` (e.g., `useUsersApi.ts`, `formatCurrency.ts`)
- **Each component** lives in its own folder with an `index.tsx` entry point

### React Patterns

- **Form separation**: Form components handle only UI/JSX. A companion `use[FormName]Form.ts` hook handles form state, validation (via Zod + zodResolver), and submission logic.
- **Styling**: Use Tailwind CSS exclusively — no CSS Modules, styled-components, or `styles.ts` files. Use `@apply` or Tailwind config for shared styles.

### Testing (React)

- Test files live in `__tests__/` within each domain, mirroring the source structure (e.g., `domains/users/__tests__/hooks/useUsersApi.test.ts`)

## Appendix: Next.js Standards

Include these **only** when Next.js is detected (not for React-only projects like Vite/CRA SPAs). These are in addition to the React standards above.

- **Server components by default**: `layout.tsx`, `page.tsx`, and `error.tsx` must never use `"use client"`. Only add `"use client"` to leaf components that need interactivity, state, or browser APIs.
- **Pages are thin**: Pages orchestrate components but do not import hooks directly. Components own their own data fetching and loading/error states.
