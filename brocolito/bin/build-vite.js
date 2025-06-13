#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import process from "node:process";
import {
  createBinFile,
  createCompletionFiles,
  getGlobalState,
  createGlobalStateFile,
  getPackageJsonDependencies,
  showSetupHint,
} from "./build-common.js";

const vite = await import("vite").catch(() => {
  throw new Error(
    "Please install missing dependency 'vite' in order to use vite builds",
  );
});

// https://vitejs.dev/config/
await vite.build({
  logLevel: "error",
  build: {
    lib: {
      entry: path.resolve("src/main.ts"),
      fileName: (_format) => "cli.js",
      formats: ["es"],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [/^node:.*/, ...(await getPackageJsonDependencies())],
      output: {
        dir: "build",
      },
    },
  },
});

const globalState = await getGlobalState();
await createGlobalStateFile(globalState);

// add global state
const cliFile = path.resolve("./build/cli.js");
const cliContent = await fs.readFile(cliFile, "utf-8");
await fs.writeFile(cliFile, 'import "./meta.js";\n' + cliContent);

// update file hashes for hot reload before next execution
if (!process.env.CI) {
  (await import("./update_hashes.js")).updateHashes(path.resolve("."));
}

// create execution wrapper
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runFile = path.join(__dirname, "run.js");
await createBinFile(globalState.name, (binFile) => fs.cp(runFile, binFile));

await createCompletionFiles(globalState.name, globalState.aliases);

showSetupHint(globalState.name);
