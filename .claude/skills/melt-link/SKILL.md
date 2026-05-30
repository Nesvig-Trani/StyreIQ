---
user-invocable: true
description: >-
  Connect and verify required integrations (ticket tracker, browser
  testing). Use after melt-setup, when tools aren't working, or when
  a skill reports missing MCP connections. Guides setup, verifies
  each tool works, and updates AGENTS.md connection status.
---

# Link

Connect and verify required integrations so other skills work at full capacity. Run this after `/melt-setup`, or whenever a skill reports a missing tool connection.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill link 2>/dev/null &
```

## Important

- This skill is a guided setup assistant — stay in a loop until each tool is verified working or the developer explicitly decides to skip it
- Don't just write config files. Actually test each integration by using it
- Update AGENTS.md connection status after each successful verification so other skills know what's available
- Every project should have these connections. There is no reason to skip them — push back if the developer tries to skip without a clear reason

## Required Connections

1. **Ticket tracker** — needed by `/melt-plan` to read stories directly instead of relying on copy-paste
2. **Browser testing** — needed by `/melt-validate` and `/melt-ux-audit` to verify UI features in the browser

## Instructions

### 0. Check Current Status

- Read AGENTS.md and find the `## Tool Connections` section
- Note which connections are already marked as connected (checked)
- If all connections are already verified, tell the developer: "All tool connections are active. Run this skill again if something stops working."
- If AGENTS.md doesn't exist or has no Tool Connections section, tell the developer to run `/melt-setup` first

### 1. Ticket Tracker

Ask the developer: "Which ticket tracker does your team use?" Offer these options:

#### Linear

Linear has a built-in connected MCP in Claude Code (OAuth-based, no API keys needed).

1. Test if it's already connected — try listing teams or recent issues using the Linear MCP tools
2. If it works → mark as connected, note "Linear" as the tool
3. If not connected → tell the developer: "Linear needs to be connected as an MCP server in Claude Code. Open Claude Code settings and connect the Linear integration under 'Connected MCPs', then come back and we'll verify it works."
4. After the developer says they've connected it, verify again by listing teams or fetching a recent issue
5. If verification fails, help diagnose:
   - "Are you logged into the correct Linear workspace?"
   - "Try disconnecting and reconnecting the Linear integration in Claude Code settings"
   - Re-verify after each fix attempt

#### GitHub Issues

GitHub Issues works through the `gh` CLI, which is already available.

1. Run `gh auth status` to check authentication
2. If authenticated → try listing recent issues: `gh issue list --limit 3`
3. If that works → mark as connected, note "GitHub Issues (via gh CLI)" as the tool
4. If `gh` is not installed → tell the developer to install it: "Install the GitHub CLI: https://cli.github.com/ — then run `gh auth login`"
5. If `gh` is installed but not authenticated → tell the developer: "Run `gh auth login` to authenticate"
6. Re-verify after each fix attempt

#### Jira

Jira requires a third-party MCP server.

1. Check if a Jira MCP server is already configured in `.mcp.json`
2. If configured → verify by attempting to use it (list recent issues)
3. If not configured → help set it up:
   - Ask the developer for their Jira base URL (e.g., `https://your-org.atlassian.net`)
   - Guide them to create an API token: "Go to https://id.atlassian.com/manage-profile/security/api-tokens and create a token"
   - Add the Jira MCP server to `.mcp.json` with the appropriate configuration
   - Verify by listing recent issues
4. If verification fails, help diagnose:
   - Check the base URL is correct
   - Check the API token is valid
   - Check the user email matches the Atlassian account
   - Re-verify after each fix attempt

#### Other

If the developer uses a different tracker (Shortcut, Asana, Notion, etc.):

1. Ask if there's an MCP server available for their tool
2. If yes → help configure it in `.mcp.json` and verify it works
3. If no → note the limitation but mark the connection with what's available. Tell the developer: "Without an MCP integration, you'll need to copy-paste ticket content into `/melt-plan`. If an MCP server becomes available for your tool, run `/melt-link` again."
4. If the developer's tool isn't supported, still mark the tracker entry in Tool Connections with what they're using so other skills know the situation

### 2. Browser Testing

#### Chrome DevTools MCP (default)

1. Check if `chrome-devtools` is in `.mcp.json` — it should be from `meltctl init`
2. If not in `.mcp.json`, add it:
   ```json
   "chrome-devtools": {
     "command": "npx",
     "args": ["-y", "@anthropic-ai/chrome-devtools-mcp@latest"]
   }
   ```
3. Verify it works — attempt to list pages or take a screenshot
4. If verification fails, diagnose:
   - "Is Google Chrome installed on this machine?"
   - "Try running `npx @anthropic-ai/chrome-devtools-mcp@latest` manually to see if there are errors"
   - Check if another process is using the Chrome debugging port
   - Re-verify after each fix attempt
5. If working → mark as connected, note "Chrome DevTools MCP" as the tool

#### Alternative browser tools

If the developer prefers Playwright MCP or another browser testing tool:

1. Help configure it in `.mcp.json`
2. Verify it can navigate to a page and interact with elements
3. Mark as connected with the tool name

### 3. Update AGENTS.md

After verifying connections, update the `## Tool Connections` section in AGENTS.md:

```markdown
## Tool Connections

Status of required integrations. If any are disconnected, run `/melt-link` to set up.

- [x] Ticket tracker — Linear (connected 2026-04-06)
- [x] Browser testing — Chrome DevTools MCP (connected 2026-04-06)
```

Use today's date. If a connection was skipped or couldn't be set up, leave it unchecked with a note:

```markdown
- [ ] Ticket tracker — Shortcut (no MCP available, copy-paste required)
```

### 4. Commit Changes

Commit any modified files (AGENTS.md, .mcp.json) with the message: `chore: connect tool integrations via melt-link`

Stage only the files that were actually changed. Do not ask for permission — these are configuration changes that should always be committed.

### 5. Summary

Print a summary of what was connected:

```
Tool connections updated:
  ✓ Ticket tracker: Linear
  ✓ Browser testing: Chrome DevTools MCP

Your skills are ready:
  /melt-plan can now read stories directly from Linear
  /melt-validate can verify UI features in the browser
  /melt-ux-audit can run interactive UX audits
```

If any connection was skipped, remind the developer what they're missing and that they can run `/melt-link` again anytime.

## Common Issues

### MCP server configured but not responding

The MCP server entry in `.mcp.json` may be correct but the server itself might not be running or accessible. Don't assume config = working. Always verify by actually using the tool.

### Developer doesn't know which tracker they use

Ask them to check their project board or ask their team lead. If they genuinely don't have a tracker, note it but encourage them to set one up — stories and tickets are essential for the `/melt-plan` workflow.

### Chrome DevTools MCP works locally but not in CI

This is expected — Chrome DevTools MCP is for local development and preview deployments, not CI. The connection status in AGENTS.md reflects the local development setup.

### Developer wants to skip everything

Push back gently: "These connections make a real difference — `/melt-plan` can read your stories directly, and `/melt-validate` can verify your UI in the browser instead of just running tests. It takes a few minutes to set up and saves time on every feature you build." If they still want to skip, respect their decision but leave the unchecked status in AGENTS.md so skills will remind them.
