# session-id

OpenCode plugin that injects the current session ID into the agent's system prompt as **ambient context** — the agent always knows its own session, like it already knows its working directory. It also exposes a `get_session_id` tool for a definitive on-demand fetch.

## Problem

The agent's own session ID was previously only retrievable via `obsidian_vault_get_session_id`, an MCP tool that runs:

```sql
SELECT id FROM session WHERE time_archived IS NULL ORDER BY time_updated DESC LIMIT 1
```

This is a **guess**: the MCP server is a separate process and cannot read OpenCode's in-process session ID. It picks the most-recently-updated non-archived session, which is wrong whenever multiple OpenCode instances run concurrently.

## Solution

OpenCode's plugin API exposes in-process hooks that receive the real session ID:

- **OpenCode 2** uses [`ctx.session.hook("context", …)`](https://opencode.ai/v2/docs/build/plugins) — the hook event carries `sessionID`, and the plugin pushes a text part into `event.system`, which becomes part of the agent's system prompt.
- **OpenCode 1.18.29+** uses [`experimental.chat.system.transform`](https://github.com/sst/opencode) with `input.sessionID` and `output.system[]`.

So the agent now sees `Session ID: ses_...` in its system prompt on every turn, and can call `get_session_id` when it needs a definitive value. No tool call, no DB query, no concurrency ambiguity.

## Install

### OpenCode 2 (opencode 2.x)

```jsonc
// ~/.config/opencode/opencode.json
{
  "plugins": [
    "@yudaiyan/opencode-session-id@git+https://github.com/yudaiyan/session-id.git#v0.2.0"
  ]
}
```

### OpenCode 1 (1.18.29 or newer)

```jsonc
// ~/.config/opencode/opencode.json
{
  "plugin": [
    "@yudaiyan/opencode-session-id@git+https://github.com/yudaiyan/session-id.git#v0.2.0"
  ]
}
```

Use a tag or commit hash rather than tracking `main`, so all sessions use a reproducible plugin version.

### Local checkout

Point OpenCode at the plugin directory (OpenCode 2) or entry file (OpenCode 1):

```jsonc
// OpenCode 2
{
  "plugins": ["/absolute/path/to/session-id"]
}
```

```jsonc
// OpenCode 1
{
  "plugin": ["file:///absolute/path/to/session-id/index.mjs"]
}
```

After changing the plugin list, quit and restart OpenCode. Plugins are loaded only during startup.

## Compatibility

| Plugin version | OpenCode 2 | OpenCode 1.18.29+ | OpenCode 1 < 1.18.29 |
| -------------- | ---------- | ----------------- | -------------------- |
| v0.2.0         | ✅         | ✅                | ❌                   |
| v0.1.0         | ❌         | ✅                | ✅                   |

One default export serves both runtimes: OpenCode 2 calls `setup()`, OpenCode 1 calls `server()`.

## Caveat

The V1 hook `experimental.chat.system.transform` is under the `experimental.*` namespace and may change in a future 1.x SDK version. The V2 hook (`session.hook("context")`) and tool transform are stable plugin APIs.

## Related

- Replaces: `obsidian_vault_get_session_id` in [obsidian-opencode-mcp-plugin](https://github.com/hardes11/obsidian-opencode-mcp-plugin)
- Companion: [vision-gate](https://github.com/hardes11/vision-gate) (same plugin-entry idiom)
