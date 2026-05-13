---
user-invocable: true
description: >-
  Run a comprehensive project compliance audit against team standards.
  Use when the developer wants to assess project health, check compliance,
  or says "audit this project". Checks 15 categories including documentation,
  testing, CI/CD, security, and AI tool setup. Produces a structured
  report with scores and actionable fixes.
---

# Audit

Run a project compliance audit against Melt team standards. Produces a structured markdown report for PM/developer review.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill audit 2>/dev/null &
```

## Important

- Be thorough — check every applicable category, don't skip checks to save time
- Provide evidence for every finding (file path, config value, or command output)
- When in doubt, mark ⚠️ Warning rather than ✅ Pass — false passes are worse than false warnings

## Instructions

### 1. Detect Project Type

Before running checks, determine the project stack so you can skip inapplicable categories:

- Read `package.json`, `composer.json`, `requirements.txt`, `Gemfile`, `*.csproj`, or `go.mod` to determine language and package manager
- Detect framework: Next.js, React Native/Expo, Laravel, Django, etc.
- Detect deployment: Vercel (`vercel.json`), Docker (`Dockerfile`), serverless (`serverless.yml`), CDK/Terraform (`infra/`, `*.tf`)
- Detect managed platforms: Vercel, Netlify, Railway, Render, Fly.io, Heroku, Laravel Vapor, Firebase, Amplify
- Determine if the project publishes packages (npm library, CLI, SDK) or is an application. Signals: `"private": true` in package.json, app frameworks, deployment to hosting platforms
- Set skip flags: skip TypeScript checks for non-JS/TS projects, skip Docker for Vercel/serverless, skip Mobile for non-React Native, etc.

### 2. Run Checks by Category

For each applicable category, run the checks below. Mark each item:

- ✅ **Pass** — requirement met. Severity: omit.
- ⚠️ **Warning** — partially met or could be improved. Severity: required (Critical/High/Medium/Low).
- ❌ **Missing** — requirement not met. Severity: required (Critical/High/Medium/Low).
- ➖ **N/A** — not applicable to this project type. Severity: omit.

Each ⚠️ Warning and ❌ Missing finding gets a **severity level** (do NOT add severity to ✅ Pass or ➖ N/A findings):

- **Critical** — immediate risk of data loss, major outage, or build/deploy break
- **High** — significant gap that should be fixed urgently (blocks adoption, breaks a key workflow, or hides bugs)
- **Medium** — notable gap that increases risk but doesn't pose immediate danger
- **Low** — minor improvement or polish

Format each finding using this line shape:

```
- {status} [{severity}] **{check id or short label}** {finding title} — {evidence}
```

Example: `- ❌ [High] **TS-Strict** TypeScript strict mode disabled — tsconfig.json:6 has "strict": false`
For ✅ Pass and ➖ N/A findings, omit the `[{severity}]` slot: `- ✅ **TS-Strict** strict mode enabled — tsconfig.json:6`

#### Documentation

- README exists with local setup instructions → check `README.md` exists, scan for setup/install/run instructions
- `.env.example` file exists → check file existence

#### TypeScript / Typing (skip if not JS/TS)

- Project uses TypeScript → check `tsconfig.json` exists, `.ts`/`.tsx` files present
- Strict mode enabled → read `compilerOptions.strict` in tsconfig
- Modern compiler options → `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch` are on, and `moduleResolution` is `bundler` or `node16` (not legacy `node`). Follow `extends` chains before judging.

#### Linting (skip if not JS/TS)

First detect which linter the project uses: ESLint (`.eslintrc.*`, `eslint.config.*`), Biome (`biome.json`, `biome.jsonc`), or other. Then check:

- Linter configured → check that a linter is set up and has rules enabled. Pass for ESLint, Biome, dprint, or any configured linter.
- Linter-formatter integration → if ESLint + Prettier, look for `eslint-config-prettier` in the ESLint config (disables rules that conflict with Prettier). If Biome, confirm its formatter is enabled. Mark N/A for other combinations.
- `lint` script exists in package.json → read `scripts.lint`
- Husky installed → check `.husky/` directory or `husky` in devDependencies
- lint-staged configured → check `.lintstagedrc*`, `lint-staged` in package.json, or `lint-staged.config.*`
- Pre-commit hook runs lint → read `.husky/pre-commit`, check it invokes lint-staged or lint

#### Formatting (skip if not JS/TS)

First detect which formatter the project uses: Prettier (`.prettierrc*`, `prettier.config.*`), Biome (`biome.json` with formatter config), or other. Then check:

- Formatter configured → check that a formatter is set up. Pass for Prettier, Biome formatter, dprint, or any configured formatter.
- Format check runs in CI → scan CI workflow files (`.github/workflows/*.yml` etc.) for `format:check`, `prettier --check`, `biome check`, or equivalent. Formatter present but not enforced in CI → ⚠️ Warning.
- Format/check script exists → check `scripts.format` or `scripts.format:check` in package.json

#### Git Hygiene

- `.gitignore` exists and covers basics → check file exists, scan for `node_modules`, `.env`, build output (`dist`/`build`/`.next`)
- `.dockerignore` exists → only check if `Dockerfile` is present, otherwise N/A
- Pre-commit hooks configured → `.husky/pre-commit` exists (or equivalent for non-JS projects)
- Commit message hook → check `.husky/commit-msg`, `commitlint` in deps, or `@commitlint/*` packages

#### Testing

- Test runner configured → check for `vitest`, `jest`, `pytest`, `phpunit`, `go test` in deps/config
- `test` script exists → check `scripts.test` in package.json (or equivalent)
- Tests actually exist → glob for `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `tests/` directory
- Test coverage configured → check for `coverage` config in vitest/jest config, or `--coverage` in test script
- Integration/E2E tests exist → check for `cypress`, `playwright`, `@playwright/test` in deps, or `e2e`/`cypress` directories

#### CI/CD Pipeline

- CI workflow files exist → `.github/workflows/` or `.gitlab-ci.yml` or other CI config
- CI runs type checking → scan workflow files for `tsc`, `typecheck`, `type-check`
- CI runs linting → scan workflow files for `lint`, `eslint`, `biome check`. If ❌ Missing and CI already runs tests, suggest adding a lint step/job in the same workflow using the project's lint command.
- CI runs tests → scan workflow files for `test`, `vitest`, `jest`, `pytest`
- CI runs build → scan workflow files for `build`
- Semantic release configured → check `.releaserc*`, `release.config.*`, `semantic-release` in deps. **Mark N/A if the project is an application (not a published package)** — apps deployed via Vercel, Vapor, ECS, etc. don't need semantic versioning.
- Changelog maintained → check `CHANGELOG.md` exists. **Mark N/A if semantic release is N/A** (apps don't need changelogs unless they choose to maintain one).

#### Deployment & Hosting

- Dockerfile exists → check file existence (N/A if Vercel/serverless project)
- Docker Compose exists → check `docker-compose.yml` or `compose.yml`
- Infrastructure as Code exists → check `infra/`, `terraform/`, `*.tf`, `cdk.json`. **If the project uses a managed platform (Vercel, Netlify, Railway, Render, Fly.io, Heroku, Laravel Vapor, Firebase, Amplify), mark N/A.** If deployment pipelines exist in CI (deploying to AWS/GCP/Azure) but no IaC is in the repo, mark ⚠️ Warning with "deployment pipeline exists but IaC not found in this repo — may be managed in a separate repository."
- Deployment pipeline configured → CI workflow has deploy steps, or Vercel/Netlify integration detected
- Environment separation → check for `.env.development`, `.env.staging`, `.env.production`, or environment references in CI workflows

#### Error Monitoring

- Sentry SDK installed → check `@sentry/*` in dependencies
- Sentry configured → check for `sentry.*.config.*` files, or search for `Sentry.init` in source
- Source maps uploaded → check for `@sentry/webpack-plugin`, `@sentry/vite-plugin`, `@sentry/esbuild-plugin`, `@sentry/nextjs`, Sentry CLI in CI, or `withSentryConfig` usage

#### Scripts & Build

For JS/TS projects, check `package.json` scripts. For non-JS projects, check `Makefile` targets, `pyproject.toml` `[project.scripts]` or `[tool.poe.tasks]`, `Taskfile.yml`, or `justfile`. Having scripts in a task runner is preferred over only documenting commands in README.

- `build` script/target exists → `scripts.build` in package.json, or `make build`, or equivalent task runner target
- `dev` script/target exists → `scripts.dev` in package.json, or `make dev`, or equivalent
- `typecheck` script exists → `scripts.typecheck` or `scripts.type-check` in package.json; for Python check `mypy`/`pyright` in Makefile or task runner. N/A if not a typed language.
- `lint` script/target exists → `scripts.lint` in package.json, or `make lint`, or equivalent
- `test` script/target exists → `scripts.test` in package.json, or `make test`, or equivalent

#### Dependency Health

- Known vulnerabilities → run the project's audit command (`npm audit --json`, `yarn audit --json`, `composer audit`, `uv run pip-audit`, `pip-audit`, or equivalent). For Python projects using uv, prefer `uv run pip-audit`; if pip-audit is not installed, suggest adding it to dev dependencies (`uv add --dev pip-audit`). Report critical/high counts. Mark ✅ if no critical/high, ⚠️ if moderate only, ❌ if critical or high vulnerabilities exist. If the audit command is not available or the project has no lockfile, mark N/A.
- Dependabot/Renovate alerts → if `gh` CLI is available, run `gh api repos/{owner}/{repo}/dependabot/alerts --jq '[.[] | select(.state=="open")] | length'` to count open alerts. Mark ✅ if 0, ⚠️ if 1-5, ❌ if more than 5. If the API returns a 403/404 (Dependabot not enabled), note that in the report.
- Outdated dependencies → run `npm outdated --json`, `yarn outdated --json`, or equivalent. Mark ⚠️ if major version updates are available for more than 5 packages. This is informational — don't mark ❌ for outdated deps alone.

#### GitHub Repository Settings

Use `gh` CLI to check these. If `gh` is not installed, suggest installing it (`brew install gh` on macOS, or see https://cli.github.com/) and authenticating (`gh auth login`). Offer to run the installation for the developer. If the developer declines or installation fails, fall back to "⚠️ Could not verify — verify manually in GitHub repository settings." If the project is hosted on GitLab or another platform (check `git remote -v`), mark all GitHub-specific checks as N/A and note that these should be verified in the platform's settings.

- Branch protection on main → run `gh api repos/{owner}/{repo}/branches/main/protection` and check response
- Required PR reviews → check `required_pull_request_reviews` in branch protection response
- Status checks required → check `required_status_checks` in branch protection response
- Merge strategy configured → run `gh api repos/{owner}/{repo}` and check `allow_rebase_merge`, `allow_squash_merge`, `allow_merge_commit`
- Dependabot or Renovate enabled → check `.github/dependabot.yml` or `renovate.json`/`.renovaterc`
- Releases/tags exist → run `gh release list --limit 5`. If the command returns actual releases, list the most recent and mark ✅. If it returns empty (no releases), mark ⚠️ Warning.
- Secret scanning enabled → run `gh api repos/{owner}/{repo}` and check `security_and_analysis.secret_scanning.status` is `"enabled"`. If the field is missing or the API returns an error, mark ⚠️ with "could not verify — may require admin access or GitHub Advanced Security."

To get `{owner}/{repo}`, run `gh repo view --json nameWithOwner -q .nameWithOwner`.

#### AI Coding Tools Setup

At least one AI coding tool must be configured. Don't flag missing tools that the team doesn't use — only flag if none of Claude, Cursor, or OpenCode is set up.

- AGENTS.md exists → check file existence
- AGENTS.md is customized → read file, check it does NOT contain `[PROJECT_OVERVIEW]`, `[VERIFICATION_COMMANDS]`, `[ARCHITECTURE_STANDARDS]`, or `[REFERENCE_EXAMPLES]`
- AI coding tool configured → check if Claude Code skills (`.claude/skills/melt-*/SKILL.md`) OR Cursor commands (`.cursor/commands/melt-*.md`) OR OpenCode commands (`.opencode/commands/melt-*.md`) exist. Pass if at least one is present. Only mark ❌ if none exists.
- `.claude/settings.json` exists → only check if `.claude/` directory exists (team uses Claude Code)
- `.mcp.json` exists → check file existence
- Project-specific AI instructions shared → pass if AGENTS.md exists and is customized (no placeholders). If CLAUDE.md or `.cursorrules` are found in `.gitignore` but not committed, add a recommendation: "Consider committing CLAUDE.md / .cursorrules so the whole team shares the same AI instructions."

#### Mobile (only if React Native or Expo detected)

Skip entirely if no React Native/Expo. Detect via `react-native` or `expo` in dependencies.

- iOS version configured → check `ios.buildNumber` in `app.json`/`app.config.*`, or Xcode project
- Android version configured → check `android.versionCode` in `app.json`/`app.config.*`, or `build.gradle`
- Preview/staging builds configured → check `eas.json` for preview/staging profiles

#### Observability (stretch)

- Performance monitoring configured → check for `@opentelemetry/*`, `@datadog/*`, `newrelic`, `@vercel/analytics`, `@vercel/speed-insights` in deps. Also check for Sentry tracing/performance (`tracesSampleRate` in Sentry config) — Sentry tracing counts as performance monitoring. OpenTelemetry (`@opentelemetry/sdk-trace-base`, `@opentelemetry/auto-instrumentations-node`, etc.) counts as performance monitoring.
- Structured logging → check for `winston`, `pino`, `morgan`, `bunyan` in deps. Cloud-native logging (CloudWatch integration via AWS SDK, Vercel's built-in logging) also counts.
- AI/LLM observability → for LLM/AI applications, check for `langfuse`, `langsmith`, or `helicone`. These count as structured observability — mark ✅ Pass if any of these are configured. Only check this for projects that use LLM APIs (e.g., `openai`, `anthropic`, `langchain` in deps).
- Health check endpoint → search source for `/health` or `/healthz` route definitions

### 3. Generate Report

Format the report as follows:

```markdown
# Project Audit Report

**Project**: {project name from package.json or directory name}
**Date**: {today's date}
**Audited by**: AI (melt-audit skill)

## Summary

| Category      | Pass    | Warn  | Missing | N/A   |
| ------------- | ------- | ----- | ------- | ----- |
| Documentation | X       | X     | X       | X     |
| ...           | ...     | ...   | ...     | ...   |
| **Total**     | **X/Y** | **Z** | **W**   | **N** |

**Overall score**: X/Y passing (Z%)

## Detailed Results

### Documentation

- ✅ README exists — `README.md` found with setup instructions
- ❌ `.env.example` missing — Create a `.env.example` listing required environment variables

### TypeScript / Typing

...

(continue for each category)

## Top Priority Actions

1. {Most impactful missing item with fix suggestion}
2. {Second most impactful}
3. {Third most impactful}
```

### 4. Save and Submit Report

- Print the full report in the conversation
- Write the report to `.audits/YYYY-MM-DD-HHmm-audit.md` (using today's date). Create the `.audits/` directory if it doesn't exist.
- **Submit to Melt Central** (Melt Studio developers only):
  1. Check whether `meltctl` is installed by running `meltctl --version`. If the command isn't found, skip this step silently — the developer isn't a Melt Studio team member and doesn't need this. Don't fall back to `npx`; a missing global CLI is the signal.
  2. If a version prints, submit the report:
     ```bash
     meltctl audit submit .audits/YYYY-MM-DD-HHmm-audit.md
     ```

     - On success, tell the developer: "This audit has been submitted to Melt Central where your team tracks and reviews all audits."
     - If it fails with an authentication error, tell them to run `meltctl login` and retry.
     - For any other error, report the failure so they can debug it.

  Melt Central is a CLI command, not an MCP server. Don't look for it in `.mcp.json` or the `## Tool Connections` section of AGENTS.md — its absence there is not a reason to skip submission.

- If the project uses a ticket tracker (Jira, Linear, GitHub Issues, or similar), offer to create tickets for each ❌ Missing finding so the team can track remediation. Group related findings into a single ticket where it makes sense (e.g., all CI gaps in one ticket). Use the appropriate tool: `gh issue create` for GitHub Issues, Linear MCP or CLI for Linear, Jira MCP or API for Jira.

## Common Issues

### gh CLI not authenticated or API returns 403

Some checks (branch protection, Dependabot alerts, secret scanning) require admin-level access. Mark these as ⚠️ with "could not verify — may require admin access" rather than ❌ Missing. Suggest the developer verify manually in GitHub repository settings.

### No CI configuration found

The project may use an external CI system (Jenkins, CircleCI, Buildkite) or a managed platform with built-in CI (Vercel, Netlify). Check for platform-specific config files before marking CI checks as missing. If deployment exists but no CI config is found in the repo, mark as ⚠️ Warning.

### Project uses unfamiliar stack

If the project uses a language or framework you're less familiar with, focus on the universal checks (documentation, git hygiene, CI/CD, error monitoring, AI tools) and mark stack-specific checks as N/A with a note explaining why.
