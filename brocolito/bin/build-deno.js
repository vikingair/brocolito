#!/usr/bin/env node

import fs from "node:fs/promises";
import {
  createBinFile,
  createCompletionFiles,
  createGlobalStateFile,
  showSetupHint,
} from "./build-common.js";

const opts = process.argv.slice(2);

// ATTENTION: While pretty similar to Bun, Deno requires extension names of TS files, and usually will require a set of
//            of flags to run several things that are required by different kinds of CLIs. We allow to pass these flags
//            in the build command and define them as standards for any CLI execution.
await createBinFile((binFile) =>
  fs.writeFile(
    binFile,
    `#!/usr/bin/env deno${opts.length ? " " + opts.join(" ") : ""}

await import("../meta.js");
await import("../../src/main.ts");
`,
  ),
);

await createGlobalStateFile();

await createCompletionFiles();
showSetupHint();
