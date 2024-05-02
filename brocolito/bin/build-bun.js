#!/usr/bin/env node

import fs from "fs/promises";
import {
  createBinFile,
  createCompletionFiles,
  createGlobalStateFile,
  showSetupHint,
} from "./build-common.js";

// ATTENTION: While in NodeJS the order of the imports determines the execution order this is not true for Bun.
//            Hence, we need to use await dynamic import in correct order.
await createBinFile((binFile) =>
  fs.writeFile(
    binFile,
    `#!/usr/bin/env bun

await import("../meta.js");
await import("../../src/main");
`,
  ),
);

await createGlobalStateFile();

await createCompletionFiles();
showSetupHint();
