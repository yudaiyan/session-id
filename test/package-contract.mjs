import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const packagePath = resolve(root, "package.json")

assert.equal(existsSync(packagePath), true, "package.json must exist for Git dependency installation")

const manifest = JSON.parse(readFileSync(packagePath, "utf8"))

assert.equal(manifest.name, "@yudaiyan/opencode-session-id")
assert.equal(manifest.type, "module")
assert.equal(manifest.main, "./index.mjs")
assert.match(manifest.version, /^\d+\.\d+\.\d+$/)
assert.equal(manifest.peerDependencies?.["@opencode-ai/plugin"], ">=1.18.29")
assert.equal(manifest.files?.includes("index.mjs"), true)
assert.equal(manifest.files?.includes("README.md"), true)

const module = await import(resolve(root, "index.mjs"))

assert.equal(module.default?.id, "session-id", "V2 definition must carry a stable id")
assert.equal(typeof module.default?.setup, "function", "V2 entrypoint setup() must exist")
assert.equal(typeof module.default?.server, "function", "V1 object entrypoint server() must exist")

const hooks = await module.default.server()
assert.equal(typeof hooks["experimental.chat.system.transform"], "function", "V1 system transform hook must exist")
assert.equal(typeof hooks.tool?.get_session_id?.execute, "function", "V1 get_session_id tool must exist")

console.log("package contract passed")
