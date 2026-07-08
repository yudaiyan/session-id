# session-id

OpenCode plugin that injects the current session ID into the agent's system prompt as **ambient context** — the agent always knows its own session, like it already knows its working directory.

## Problem

The agent's own session ID was previously only retrievable via `obsidian_vault_get_session_id`, an MCP tool that runs:

```sql
SELECT id FROM session WHERE time_archived IS NULL ORDER BY time_updated DESC LIMIT 1
```

This is a **guess**: the MCP server is a separate process and cannot read OpenCode's in-process session ID. It picks the most-recently-updated non-archived session, which is wrong whenever multiple OpenCode instances run concurrently.

## Solution

OpenCode's plugin SDK exposes [`experimental.chat.system.transform`](https://github.com/sst/opencode) — an in-process hook that receives `input.sessionID` (reliable: one OpenCode process = one session = its own plugin instance) and lets the plugin push strings into `output.system[]`, which become part of the agent's system prompt.

So the agent now sees `Session ID: ses_...` in its system prompt on every turn. No tool call, no DB query, no concurrency ambiguity.

## Install

Add to `~/.config/opencode/opencode.jsonc`:

```jsonc
"plugin": [
  "oh-my-opencode-slim",
  "./scripts/vision-gate/index.mjs",
  "./scripts/session-id/index.mjs"
]
```

## Caveat

`experimental.chat.system.transform` is under the `experimental.*` namespace and may change in a future SDK version. The plugin is ~15 lines; a one-line update would be needed if the hook is renamed.

## Related

- Replaces: `obsidian_vault_get_session_id` in [obsidian-opencode-mcp-plugin](https://github.com/hardes11/obsidian-opencode-mcp-plugin)
- Companion: [vision-gate](https://github.com/hardes11/vision-gate) (same plugin-entry idiom)
