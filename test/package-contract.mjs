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
assert.equal(manifest.peerDependencies?.["@opencode-ai/plugin"], ">=1.18.25")
assert.equal(manifest.files?.includes("index.mjs"), true)
assert.equal(manifest.files?.includes("README.md"), true)

console.log("package contract passed")
