// session-id — ambient session-ID injection
// Exposes the in-process session ID (input.sessionID) as part of the system
// prompt, so the agent always knows its own session without guessing from the
// session database. Retires the unreliable obsidian_vault_get_session_id MCP
// tool (a separate-process DB query that fails under concurrency).
// https://github.com/hardes11/session-id
//
// Mechanism: experimental.chat.system.transform is an in-process plugin hook
// that receives input.sessionID (reliable, one OpenCode process = one session =
// its own plugin instance) and lets us push strings into output.system[], which
// become part of the agent's system prompt.

export default async function () {
  return {
    // Fires on every chat turn. Pushes "Session ID: ses_..." into the system
    // prompt. The agent reads it like CWD — ambient, always known.
    "experimental.chat.system.transform": async function (input, output) {
      if (input.sessionID) {
        output.system.push(`Session ID: ${input.sessionID}`);
      }
    },
  };
}
