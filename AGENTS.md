# AGENTS.md

## Project Overview

StyreIQ is a governance and compliance platform for social accounts, policies, and risk signals. The app is a single Next.js 15 package using Payload CMS 3.33, PostgreSQL (Vercel Postgres adapter in code), React 19, Tailwind CSS 4, and Radix UI — deployable via Vercel or Docker. See [README.md](README.md) for environment variables and local database setup.

## Verification Commands

Package scripts are defined in `package.json`. The repo declares **pnpm** in `engines` (`^9 || ^10`); `yarn.lock` / `package-lock.json` are also present — use one package manager consistently with your team.

- Install dependencies: `pnpm install`
- Development server: `pnpm dev` (clean `.next` first: `pnpm devsafe`)
- Lint: `pnpm lint`
- Typecheck: `pnpm type-check`
- Lint + typecheck (CI-style): `pnpm ci:checks`
- Production build: `pnpm build`
- Production server (after build): `pnpm start`
- Local database: `docker compose up -d` (see README)
- Run Payload migrations: `pnpm db:migrate` (alias for `payload migrate`)
- Create a new migration: `pnpm db:create`
- Regenerate Payload TypeScript types: `pnpm generate:types`
- Regenerate Payload admin import map: `pnpm generate:importmap`

There is **no** `test` script in `package.json`; rely on `ci:checks`, manual QA, and browser validation until a test runner is added.

## Architecture Standards

### Important: Respect Existing Code

Before applying any standards below, **understand the existing project structure first**. If the project already follows a different architecture or pattern, continue following the existing conventions. These standards apply to new code in greenfield areas — never refactor or restructure existing code to match these guidelines unless explicitly asked.

**Layout**

- **Next.js App Router** lives under `src/app/`, with route groups such as `(auth)`, `(dashboard)`, `(landing)`, and `(payload)` for the Payload admin UI.
- **Product domains** live under `src/features/<domain>/` (e.g. `users`, `policies`, `flags`, `social-medias`). Payload is extended via **plugins** that register collections, endpoints, hooks, and jobs.
- **Shared UI and utilities** belong in `src/shared/`; cross-feature imports should go through shared modules rather than coupling domains.
- **Payload** is composed in `src/lib/payload/payload.config.ts` (database adapter, plugins, jobs, email). Generated types and schema artifacts live under `src/types/` (e.g. `payload-types.ts` from `pnpm generate:types`).
- **Environment variables** are validated in `src/config/env.ts` (`@t3-oss/env-nextjs` + Zod).

**Conventions**

- Prefer **feature-local** components and hooks next to the feature they serve; keep route `page.tsx` / `layout.tsx` files thin where possible.
- After changing Payload collections or fields, run **`pnpm generate:types`** and apply migrations as needed before merging.
- Use existing **Radix + Tailwind** patterns from `src/shared` for new UI.

### Appendix: React Standards

These are **Melt's preferred defaults for domain-driven React apps**. File-based routing (Next.js App Router) defines structure — do not force a parallel domain folder layout onto `src/app/`. **Skip any pattern that conflicts with this repo** (e.g. prefer existing `src/features/` over introducing a separate `domains/` tree).

#### Architecture

For new frontend code, prefer domain-driven architecture:

- Each domain is self-contained with its own components, hooks, schemas, types, and utils
- Each domain exposes a public API via a barrel `index.ts` — external consumers import from the barrel, never deep-import internal files
- Cross-domain imports go through a `shared/` directory — never import directly between domains
- All external API communication goes through hooks (e.g., `hooks/services/`) — no separate `services/` directory
- Centralize UI permission logic in a `permissions/` directory — never hardcode role checks in components
- Define Zod schemas at system boundaries and infer types from them (`z.infer<>`)
- For domains with many components, consider grouping into sub-directories (e.g., `cards/`, `forms/`, `tables/`)

#### Naming Conventions

- **Folders**: `kebab-case` (e.g., `user-profile/`, `order-history/`)
- **Component files**: `PascalCase.tsx` (e.g., `UserCard.tsx`, `OrderList.tsx`)
- **Logic files**: `camelCase.ts` (e.g., `useUsersApi.ts`, `formatCurrency.ts`)
- **Each component** lives in its own folder with an `index.tsx` entry point

#### React Patterns

- **Form separation**: Form components handle only UI/JSX. A companion `use[FormName]Form.ts` hook handles form state, validation (via Zod + zodResolver), and submission logic.
- **Styling**: Use Tailwind CSS exclusively — no CSS Modules, styled-components, or `styles.ts` files. Use `@apply` or Tailwind config for shared styles.

#### Testing (React)

- Test files live in `__tests__/` within each domain, mirroring the source structure (e.g., `domains/users/__tests__/hooks/useUsersApi.test.ts`)

### Appendix: Next.js Standards

- **Server components by default**: `layout.tsx`, `page.tsx`, and `error.tsx` must never use `"use client"`. Only add `"use client"` to leaf components that need interactivity, state, or browser APIs.
- **Pages are thin**: Pages orchestrate components but do not import hooks directly. Components own their own data fetching and loading/error states.

### Code Quality

- Comments explain **why**, not what — document business logic decisions, workarounds, and non-obvious behavior. Never comment obvious code.
- Extract magic numbers and strings into named constants
- Handle all UI states: loading, error, and empty — not just the happy path
- Never explicitly return HTTP 500 errors — let unhandled errors bubble up to the error handler (Sentry, error middleware, etc.)

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
- Run the project's configured test runner (check for vitest, jest, or similar)
- Use descriptive test names that explain the scenario: `"should return 404 when user is not found"`, not `"should work"`

### Pull Requests

- One concern per PR — don't refactor surrounding code while implementing a feature. If cleanup is needed, do it in a separate PR.
- When adding code to an existing file, match the patterns already in use (error handling, naming, structure)
- Aim for 200-400 changed lines per PR; avoid exceeding 1,000 lines. Exception: large refactors may exceed this when the changes are mechanical and reviewable (e.g., renaming across many files).
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

For any non-trivial change (multi-file or unfamiliar code):

0. Understand the story — read the full ticket/story and linked PRD before starting. If requirements are unclear, the developer should clarify with the PM or client first.

1. Plan — explore the codebase, design the approach, define a validation plan, create the working branch, write the plan to `.plans/<sprint>/TICKET-XXX.md`
2. Implement in small steps, validating continuously as you go
3. Validate — run the validation plan end-to-end. Prefer browser-based validation (Chrome DevTools MCP) over just running tests. Check preview deployments when available
4. Developer validates manually — prompt them with specific observation questions they can only answer by using the feature
5. Review — developer reviews the code with agent-prepared materials, decisions recorded in plan file
6. PR — create the pull request, referencing the plan and validation results

### Context Efficiency

- Prefer single-file operations (typecheck, lint, test one file) over full-project commands
- Scope searches narrowly — read specific files rather than entire directories
- For large investigations, use subagents to keep the main context clean

### Session Handoff

- Never leave the codebase in a broken intermediate state
- When completing a multi-step task, summarize what was done and what remains
- Ensure all changes build and pass tests before ending a session

## Tool Access

- Use available tools proactively: `gh` CLI for GitHub, Chrome DevTools MCP for browser testing, AWS CLI for infrastructure, database clients for queries
- Set up MCP servers for your team's tools (ticket tracking, documentation, design systems) so agents can access them directly

## Tool Connections

Status of required integrations. If any are disconnected, run `/melt-link` to set up.

- [x] Ticket tracker — Linear (connected 2026-05-05; MCP entry `linear` in [`.mcp.json`](.mcp.json) via [`mcp-remote` → Linear hosted MCP](https://linear.app/docs/mcp); first use may prompt OAuth — if auth errors, clear `~/.mcp-auth` per Linear FAQ and retry)
- [x] Browser testing — Chrome DevTools MCP (connected 2026-05-05; [`chrome-devtools`](.mcp.json) — Google Chrome detected on PATH; reload Cursor MCP if tools do not appear in chat)

Supplementary — GitHub Issues / PR workflows: `gh` CLI authenticated locally (not a substitute for Linear).

## Workflow Skills

The following workflows are available as AI skills. When a developer asks you to plan, review, create a PR, or debug — suggest using the corresponding skill for a structured approach instead of doing it ad-hoc.

- **/melt-setup** - Analyze the project and customize AGENTS.md for this codebase
- **/melt-link** - Connect and verify required integrations (ticket tracker, browser testing) so other skills work at full capacity
- **/melt-plan** - Gather requirements, explore codebase, design approach, write plan to `.plans/<sprint>/TICKET-XXX.md`
- **/melt-validate** - Run the validation plan from the plan document, verify with browser, suggest new tests, prompt developer for manual sign-off
- **/melt-review** - Prepare review brief for the developer, facilitate code review, record developer's review decisions in the plan file
- **/melt-pr** - Create PR or address reviewer feedback on existing PR. Verifies validation and review are complete before creating.
- **/melt-debug** - Investigate issues, isolate root cause, write regression test, fix
- **/melt-audit** - Run a project compliance audit against team standards
- **/melt-ux-audit** - Review UI against usability heuristics via Chrome DevTools MCP. Full project audit or feature-scoped during active plans
- **/melt-security-audit** - Run a security posture audit across the entire platform — infrastructure, encryption, auth, data protection, and compliance readiness
- **/melt-update** - Update Melt skills and standards to the latest version
- **/melt-help** - Answer questions about the AI-First Development Playbook and team workflow

## Reference Examples

- **Payload app composition**: follow `src/lib/payload/payload.config.ts` (plugins, jobs, DB adapter, generated types path).
- **Feature plugin registering a collection**: follow `src/features/users/plugins/index.ts` and sibling `collections` under the same feature.
- **Environment boundary (Zod)**: follow `src/config/env.ts`.
- **App Router shell**: follow `src/app/layout.tsx` and route-group layouts under `src/app/(dashboard)/`, `(auth)/`, `(payload)/`.
- **Tenant-style collection config**: follow `src/features/tenants/plugins/collections/index.ts` for Payload field and access patterns.
