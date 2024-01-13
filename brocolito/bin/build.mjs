#!/usr/bin/env node

import path from "path";
import { build } from "vite";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import {
  GLOBAL_STATE,
  packageJSON,
  createBinFile,
  createCompletionFiles,
  showSetupHint,
} from "./build-common.mjs";

// https://vitejs.dev/config/
await build({
  logLevel: "error",
  build: {
    lib: {
      entry: path.resolve("src/main.ts"),
      fileName: (_format) => "cli.cjs",
      formats: ["cjs"],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [/^node:.*/, ...Object.keys(packageJSON.dependencies)],
      output: {
        dir: "build",
      },
    },
  },
});

// add global state
const cliFile = path.resolve("./build/cli.cjs");
const cliContent = await fs.readFile(cliFile, "utf-8");
await fs.writeFile(
  cliFile,
  cliContent.replace(
    /^"use strict";/,
    `"use strict";global.__BROCOLITO__=${JSON.stringify(GLOBAL_STATE)};`,
  ),
);

// update file hashes for hot reload before next execution
if (!process.env.CI)
  (await import("./update_hashes.cjs")).updateHashes(path.resolve("."));

// create execution wrapper
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runFile = path.join(__dirname, "run.cjs");
await createBinFile((binFile) => fs.cp(runFile, binFile));

await createCompletionFiles();

showSetupHint();
