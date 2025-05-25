#!/usr/bin/env node

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageDir = path.join(__dirname, "..", "..");
const needsUpdate = process.env.CI
  ? undefined
  : /** @type {import("./update_hashes.js")} */ (
      await import(/** @type {any} */ ("brocolito/bin/update_hashes.js"))
    ).needsUpdate(packageDir);

if (needsUpdate) {
  // sadly "import.meta.resolve" resolves wrongly in some situations. Hence, we need "require.resolve"
  const require = createRequire(import.meta.url);
  const notCompletion = !process.env.COMP_LINE;
  if (notCompletion) process.stdout.write("🥦Rebuilding ⚙️...");
  (await import("node:child_process")).execSync(
    "node " + require.resolve("brocolito/bin/build.js"),
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

await import(/** @type {any} the actual CLI code */ ("../cli.js"));
