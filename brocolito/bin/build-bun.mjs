#!/usr/bin/env node

import fs from "fs/promises";
import {
  createBinFile,
  createCompletionFiles,
  createGlobalStateFile,
  showSetupHint,
} from "./build-common.mjs";

await createBinFile((binFile) =>
  fs.writeFile(
    binFile,
    `#!/usr/bin/env bun

import "./meta.mjs";
import "../../src/main";
`,
  ),
);

await createGlobalStateFile();

await createCompletionFiles();
showSetupHint();
