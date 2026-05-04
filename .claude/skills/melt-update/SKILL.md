---
user-invocable: true
description: >-
  Update Melt skills and standards to the latest version. Use when the
  developer wants the latest skill templates, says "update melt", or
  after a new meltctl version is released. Fetches latest templates,
  preserves project customizations in AGENTS.md, and merges changes.
---

# Update

Update Melt skills and standards to the latest version.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill update 2>/dev/null &
```

## Instructions

### 0. Pre-checks

- Read AGENTS.md. If it contains `[PLACEHOLDER]` markers (like `[PROJECT_OVERVIEW]`, `[VERIFICATION_COMMANDS]`, `[ARCHITECTURE_STANDARDS]`, or `[REFERENCE_EXAMPLES]`), **stop** and tell the developer to run `/melt-setup` first — the file hasn't been customized yet, so there's nothing to preserve.
- Run `git status` to check for uncommitted changes. If the working tree is dirty, ask the developer to commit or stash their changes before proceeding — the update modifies multiple files and the changes should be in their own commit.

### 1. Fetch Latest Templates

Check whether `meltctl` is installed by running `meltctl --version`. If the command isn't found, **stop** and tell the developer: "The `/melt-update` workflow requires the Melt Studio CLI. If you're a Melt Studio developer, install it with `npm install -g @meltstudio/meltctl@latest` and run `meltctl login`. Otherwise, this workflow isn't available — your team lead can update the tools for you."

Run the following command and capture the output. If it fails with an authentication error, tell the developer to run `meltctl login` and retry:

```bash
meltctl project templates
```

The command prints a temp directory path containing the latest template files. Read the files from that directory.

### 2. Detect Installed Tools

Check which tools are configured in the project:

- **Claude Code**: look for `.claude/skills/melt-*/SKILL.md` files
- **Cursor**: look for `.cursor/commands/melt-*.md` files
- **OpenCode**: look for `.opencode/commands/melt-*.md` files

Only update files for tools that are already installed. Do not add files for tools the project doesn't use.

### 3. Update Skills and Commands

For each installed skill/command, use `diff` to compare the template version with the current version — never compare by reading both files and judging mentally. LLMs are unreliable at spotting differences in large similar markdown files.

For each tool type, match template files to local files by name (e.g., template `plan.md` → local `melt-plan`):

- **Claude Code skills**: `.claude/skills/melt-*/SKILL.md`
- **Cursor commands**: `.cursor/commands/melt-*.md`
- **OpenCode commands**: `.opencode/commands/melt-*.md`

For each matched pair:

- Use `diff` to compare. If no meaningful differences, skip it.
- Update the skill/command content from the template. If the local file has metadata (e.g., YAML frontmatter) that the template doesn't, preserve it.
- If a template has no matching local file, create it as a new skill/command.

**Cursor commands** have no project-specific customizations — replace the file wholesale.

### 4. Update `.claude/settings.json`

If the file exists:

- Parse both the template and existing settings
- **Union the `permissions.allow` arrays** — add new entries from the template, keep existing ones, deduplicate
- **Union the `permissions.deny` arrays** — same approach
- **Preserve all other fields** in the existing config (don't overwrite custom settings)

### 5. Update `.mcp.json`

If the file exists:

- Parse both the template and existing config
- **Add new servers from the template** that don't exist in the current config
- **Never remove existing servers** — the project may have added its own MCP servers
- **Don't overwrite existing server configs** — if a server key already exists, keep the current version

### 6. Update AGENTS.md

This is the sensitive part — AGENTS.md contains both universal standards and project-specific customizations.

**Identify universal sections** (from the template):

- Code Quality
- Security
- No Shortcuts
- Testing
- Pull Requests
- Agent Permissions
- Agent Behavior (Default Workflow, Context Efficiency, Session Handoff)
- Tool Access
- Workflow Skills

**Identify project-specific sections** (do NOT modify):

- Project Overview
- Verification Commands
- Architecture Standards (including "Respect Existing Code" intro, but the project-specific content below it)
- Reference Examples

**For each universal section**:

1. Use `diff` to compare the template version with the current version — extract the section from both files and diff them. Do not compare by reading both and judging mentally.
2. If no differences, skip it
3. If there are differences, read the diff output to understand what changed
4. Check if the developer added custom bullets to this section — preserve them

**Before applying any AGENTS.md changes**:

- Present a summary to the developer showing what changed in each universal section
- Include a diff-like view of added/removed/changed lines
- **Wait for developer approval before applying**

**When applying approved changes**:

- Replace the universal section content with the template version
- Re-add any custom bullets the developer had added (append them at the end of the section)
- Update the Workflow Skills list to match the template
- Do not touch project-specific sections

### 7. Summary

After all updates are applied:

- List every file that was changed and what changed
- List any new files that were created (new skills/commands)
- List anything that was skipped (unchanged files)
- Ask the developer if they'd like to commit the changes

Suggest a commit message:

```
chore: update melt standards to latest version
```
