#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import process from "node:process";

export const packageJSON = JSON.parse(
  await fs.readFile("package.json", "utf-8"),
);
const VALID_NAME = /^[a-zA-Z0-9_-]+$/;
if (!VALID_NAME.test(packageJSON.name)) {
  throw new Error(
    "Please use valid name for the CLI in your package.json. Satisfying the constraint: " +
      VALID_NAME,
  );
}

const GLOBAL_STATE = {
  name: packageJSON.name,
  dir: path.resolve("."),
  version: packageJSON.version,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve("./build/");
const binDir = path.join(buildDir, "bin");

export const createGlobalStateFile = async () => {
  // create execution wrapper
  const file = path.join(buildDir, "meta.js");
  await fs.writeFile(
    file,
    `globalThis.__BROCOLITO__=${JSON.stringify(GLOBAL_STATE)};\n`,
  );
};

/**
 * @param {(file: string) => Promise<void>} createCb
 */
export const createBinFile = async (createCb) => {
  // create execution wrapper
  const binFile = path.join(binDir, packageJSON.name);
  await fs.mkdir(binDir, { recursive: true });
  await createCb(binFile);
  await fs.chmod(binFile, "744");
};

export const createCompletionFiles = async () => {
  // copy completion scripts into build dir
  const bashCompletion = await fs.readFile(
    path.join(__dirname, "bash_completion.sh"),
    "utf-8",
  );
  const zshCompletion = await fs.readFile(
    path.join(__dirname, "zsh_completion.sh"),
    "utf-8",
  );
  await fs.writeFile(
    path.resolve("./build/bash_completion.sh"),
    bashCompletion.replaceAll("BRO", packageJSON.name),
  );
  await fs.writeFile(
    path.resolve("./build/zsh_completion.sh"),
    zshCompletion.replaceAll("BRO", packageJSON.name),
  );
};

export const showSetupHint = () => {
  if (
    !process.env.CI &&
    !process.env.BROCOLITO_REBUILD &&
    !(/** @type {string} */ (process.env.PATH).split(":").includes(binDir))
  ) {
    console.log(`
To make the CLI ${packageJSON.name} globally accessible, you have to run this:
export PATH="${binDir}:$PATH"`);
  }
};
