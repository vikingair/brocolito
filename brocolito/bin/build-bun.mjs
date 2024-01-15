#!/usr/bin/env node

import fs from "fs/promises";
import {
  GLOBAL_STATE,
  createBinFile,
  createCompletionFiles,
  showSetupHint,
} from "./build-common.mjs";

await createBinFile((binFile) =>
  fs.writeFile(
    binFile,
    `#!/usr/bin/env bun

global.__BROCOLITO__=${JSON.stringify(GLOBAL_STATE)};
await import("../../src/main");
`,
  ),
);

await createCompletionFiles();
showSetupHint();
