#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageDir = path.join(__dirname, "..", "..");
const needsUpdate = process.env.CI
  ? undefined
  : /** @type {import("./update_hashes.mjs")} */ (
      await import(/** @type {any} */ ("brocolito/bin/update_hashes.mjs"))
    ).needsUpdate(packageDir);

if (needsUpdate) {
  const notCompletion = !process.env.COMP_LINE;
  notCompletion && process.stdout.write("🥦Rebuilding ⚙️...");
  (await import("node:child_process")).execSync(
    "node " + import.meta.resolve("brocolito/bin/build.mjs"),
    {
      cwd: packageDir,
      stdio: "inherit",
      env: { ...process.env, BROCOLITO_REBUILD: "true" },
    },
  );
  if (notCompletion) {
    const readline = await import("node:readline");
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
  }
}

await import(/** @type {any} the actual CLI code */ ("../cli.mjs"));
