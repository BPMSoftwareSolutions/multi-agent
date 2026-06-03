# Multi-Agent Studio CLI

A command-line interface for the stage-based multi-agent design workshop.

## Quick Start

### Create a new session
```bash
node bin/studio.js start "Build a mobile app that helps people organize their thoughts"
```

### Check current state
```bash
node bin/studio.js show
```

### Run a round (Planner → Reviewer)
```bash
node bin/studio.js round
node bin/studio.js round --note "Make the core concept clearer"
```

### Accept the proposed artifact
```bash
node bin/studio.js accept
```

### Move to the next stage
```bash
node bin/studio.js next-stage
```

### Execute the next approved action
```bash
node bin/studio.js run-worker
```

### Check status (JSON format)
```bash
node bin/studio.js status
```

---

## Full Workflow Example

```bash
# 1. Start a session
node bin/studio.js start "Build a single-page workshop app for debating product ideas"

# 2. Check what was created
node bin/studio.js show

# 3. Run a round with guidance
node bin/studio.js round --note "Keep the interaction model simple, focus on the debate core"

# 4. Review the proposed artifact
node bin/studio.js show

# 5. If satisfied, accept it
node bin/studio.js accept

# 6. Move to ASCII sketch stage
node bin/studio.js next-stage

# 7. Repeat: run rounds, accept, advance
node bin/studio.js round --note "Create a simple 3-column layout"
node bin/studio.js show
node bin/studio.js accept
node bin/studio.js run-worker
node bin/studio.js next-stage

# 8. Final stage: implementation plan
node bin/studio.js round --note "List the essential components and API endpoints"
node bin/studio.js accept
node bin/studio.js next-stage

# All done!
```

---

## Environment

Set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
# or
export CLAUDE_API_KEY=sk-ant-...
```

---

## Session Persistence

Sessions are stored in SQL Server, not local JSON files.

Default local target:

```text
Server: BPMHOMEOFFICE
Database: ai-engine
Schema: studio
```

Key tables:

```text
studio.sessions
studio.app_state
studio.oauth_tokens
```

The session record includes stage state, operations queue state, worker attempts, and Drive sync state in durable SQL storage that you can inspect from SSMS.

### Inspect sessions directly in SQL
```sql
SELECT TOP 20 session_id, brief, current_stage, completed, created_at, updated_at
FROM studio.sessions
ORDER BY created_at DESC;
```

---

## JSON Output

All commands support `--json` for machine-readable output:

```bash
node bin/studio.js start "Brief" --json
node bin/studio.js status --json
node bin/studio.js round --json
```

---

## Exit Codes

- **0** = Success
- **1** = User error (e.g., no active session, cannot accept without proposed artifact)
- **2** = System error (e.g., LLM failure, storage error)

---

## Storage Configuration

Override the SQL target with environment variables when needed:

```env
SQL_SERVER_INSTANCE=BPMHOMEOFFICE
SQL_DATABASE=ai-engine
SQL_SCHEMA=studio
```

---

## Architecture

```
src/core/          ← Pure engine (no HTTP, no UI)
  ├── stages.js
  ├── session-store.js
  ├── llm-client.js
  ├── prompt-builders.js
  └── run-round.js

src/cli/           ← CLI adapter
  ├── print.js
  └── commands/
      ├── start.js
      ├── show.js
      ├── round.js
      ├── accept.js
      ├── next-stage.js
      └── status.js

bin/               ← Entry point
  └── studio.js
```

This separation means you can:
- Test the core with `studio` commands
- Verify behavior via JSON output
- Add HTTP routes later using the same core
- Build a UI on top of the HTTP API
