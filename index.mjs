// session-id — ambient session-ID injection + on-demand get_session_id tool
//
// Exposes the in-process session ID two ways:
//  1. AMBIENT: the ID is pushed into the system prompt on every turn, so the
//     agent knows its own session like it knows its working directory.
//  2. ON-DEMAND: a get_session_id tool for a definitive fetch — guards against
//     the model misreading a value buried in a large system prompt.
//
// Retires the unreliable obsidian_vault_get_session_id MCP tool (a
// separate-process DB query that fails under concurrency).
// https://github.com/hardes11/session-id
//
// Compatibility: one default export serves both runtimes.
//  - OpenCode 2 calls setup() and registers a session context hook plus a tool
//    transform.
//  - OpenCode 1.18.29+ calls server() and returns the legacy hooks object.
//    V1 releases before 1.18.29 cannot load object entrypoints; use v0.1.0.
//
// Both paths avoid importing a plugin SDK helper: Plugin.define and tool() are
// identity functions, and raw object literals keep this file free of any
// module-resolution dependency. The session ID always comes from the in-process
// runtime (hook input / tool context), never from a database query.

const TOOL_NAME = "get_session_id"

const TOOL_DESCRIPTION =
  "Return the current opencode session ID — definitive and in-process. Call this to confirm the session ID for dashboards, handoffs, or daily-note labels rather than recalling the ambient value, which can be misread in a large system prompt. Takes no arguments."

function legacyEntrypoint() {
  return {
    // Fires on every chat turn. Pushes "Session ID: ses_..." into the system
    // prompt. The agent reads it like CWD — ambient, always known.
    "experimental.chat.system.transform": async function (input, output) {
      if (input.sessionID) {
        output.system.push(`Session ID: ${input.sessionID}`)
      }
    },

    // On-demand tool. context.sessionID is the definitive, in-process session ID.
    tool: {
      [TOOL_NAME]: {
        description: TOOL_DESCRIPTION,
        args: {},
        async execute(_args, context) {
          return context.sessionID
        },
      },
    },
  }
}

export default {
  id: "session-id",

  // OpenCode 2 entrypoint.
  async setup(ctx) {
    // Ambient injection: the `context` hook runs immediately before every
    // agent-loop model request and exposes the current session ID.
    await ctx.session.hook("context", (event) => {
      event.system.push({ type: "text", text: `Session ID: ${event.sessionID}` })
    })

    // On-demand tool: the executor context carries the running session ID.
    await ctx.tool.transform((editor) => {
      editor.add({
        name: TOOL_NAME,
        description: TOOL_DESCRIPTION,
        input: { type: "object", properties: {}, additionalProperties: false },
        async execute(_input, context) {
          return { content: context.sessionID }
        },
      })
    })
  },

  // OpenCode 1.18.29+ entrypoint.
  async server() {
    return legacyEntrypoint()
  },
}
