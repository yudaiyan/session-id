// session-id — ambient session-ID injection + on-demand get_session_id tool
// Exposes the in-process session ID two ways:
//  1. AMBIENT: pushed into the system prompt on every turn via
//     experimental.chat.system.transform (the agent knows its own session like
//     it knows its CWD).
//  2. ON-DEMAND: a get_session_id tool the agent can call for a definitive fetch —
//     guards against the model misreading/hallucinating a value buried in a large
//     system prompt (seen in brain-vault bootstrap ses_093efe1b9ffe3K3wKR8XUWcUcz,
//     which fabricated ses_055c9401e0e01c03 despite the correct ID being injected).
//
// Retires the unreliable obsidian_vault_get_session_id MCP tool (a separate-process
// DB query that fails under concurrency).
// https://github.com/hardes11/session-id
//
// Schema note: ToolDefinition = { description, args: z.ZodRawShape, execute }.
// `args: {}` = parameter-less. The raw object literal is equivalent to the tool()
// helper (which is an identity function) and avoids importing @opencode-ai/plugin
// from a .mjs (keeps the existing injection free of any resolution dependency).
// execute receives ToolContext; context.sessionID is the running session's ID,
// populated per-call by opencode's core (in-process, reliable).

export default async function () {
  return {
    // Fires on every chat turn. Pushes "Session ID: ses_..." into the system
    // prompt. The agent reads it like CWD — ambient, always known.
    "experimental.chat.system.transform": async function (input, output) {
      if (input.sessionID) {
        output.system.push(`Session ID: ${input.sessionID}`);
      }
    },

    // On-demand tool. context.sessionID is the definitive, in-process session ID.
    // The agent calls this to confirm its session for dashboards / handoffs /
    // daily-note labels instead of trusting a recalled ambient value.
    tool: {
      get_session_id: {
        description:
          "Return the current opencode session ID — definitive and in-process. Call this to confirm the session ID for dashboards, handoffs, or daily-note labels rather than recalling the ambient value, which can be misread in a large system prompt. Takes no arguments.",
        args: {},
        async execute(_args, context) {
          return context.sessionID;
        },
      },
    },
  };
}
