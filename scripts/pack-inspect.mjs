#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = ["packages/verify", "packages/sdk", "packages/node", "packages/cli"];

const FORBIDDEN = [
  /BEGIN PRIVATE KEY/,
  /BEGIN RSA PRIVATE KEY/,
  /DATABASE_URL=/,
  /FLY_API_TOKEN=/,
  /NPM_TOKEN=/,
  /GITHUB_TOKEN=/,
  /ghp_[A-Za-z0-9]{20,}/,
  /npm_[A-Za-z0-9]{20,}/,
];

const FORBIDDEN_PATHS = [/^\.env/, /node_modules\//, /coverage\//, /\.pem$/, /fly\.toml$/];
const PLACEHOLDER_KEYS = new Set([
  "f402m_your_key_here",
  "f402m_testkey0001",
  "f402m_merchant",
  "f402m_other",
  "f402m_bad",
]);

function run(cmd, cwd = root) {
  return execSync(cmd, { cwd, encoding: "utf8" }).trim();
}

let failed = false;
for (const dir of PACKAGES) {
  const abs = join(root, dir);
  const listing = run("npm pack --dry-run --json --ignore-scripts", abs);
  const parsed = JSON.parse(listing);
  const pack = Array.isArray(parsed) ? parsed[0] : parsed;
  const files = pack.files.map((f) => f.path);
  console.log(`\n${pack.filename} (${pack.entryCount} files, ${pack.size} bytes)`);
  for (const path of files) {
    console.log(`  ${path}`);
    if (FORBIDDEN_PATHS.some((re) => re.test(path))) {
      console.error(`  FORBIDDEN PATH ${path}`);
      failed = true;
    }
  }
  const tmp = mkdtempSync(join(tmpdir(), "fiscal402-pack-"));
  try {
    const tarball = run("npm pack --ignore-scripts", abs);
    const packed = join(abs, tarball);
    run(`tar -xzf ${JSON.stringify(packed)} -C ${JSON.stringify(tmp)}`);
    let blob = "";
    try {
      blob = run(`grep -R --binary-files=text . ${JSON.stringify(join(tmp, "package"))}`);
    } catch {
      blob = "";
    }
    for (const re of FORBIDDEN) {
      if (re.test(blob)) {
        console.error(`  FORBIDDEN PATTERN ${re}`);
        failed = true;
      }
    }
    const liveKeys = blob.match(/f402m_[A-Za-z0-9_-]{8,}/g) ?? [];
    for (const key of liveKeys) {
      if (!PLACEHOLDER_KEYS.has(key) && !key.startsWith("f402m_****")) {
        console.error(`  POSSIBLE LIVE KEY ${key.slice(0, 12)}…`);
        failed = true;
      }
    }
    rmSync(packed, { force: true });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (failed) {
  console.error("\npack inspect FAILED");
  process.exit(1);
}
console.log("\npack inspect PASS");
