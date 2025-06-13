#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import process from "node:process";

const VALID_CLI_NAME = /^[a-zA-Z0-9_-]+$/;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve("./build/");
const binDir = path.join(buildDir, "bin");

const getPackageJson = async () => {
  const packageJSONContent = await fs
    .readFile("package.json", "utf-8")
    .catch(() => fs.readFile("deno.json", "utf-8"))
    .catch(() => {
      throw new Error("Cannot find package.json nor deno.json");
    });
  return JSON.parse(packageJSONContent);
};

export const getPackageJsonDependencies = async () => {
  const packageJSON = await getPackageJson();
  // "imports" in "deno.json"
  return Object.keys(packageJSON.dependencies || packageJSON.imports);
};

export const getGlobalState = async () => {
  const packageJSON = await getPackageJson();
  const dir = path.resolve(".");
  const globalState = {
    name: packageJSON.name || path.basename(dir),
    dir,
    version: packageJSON.version,
    aliases: packageJSON.brocolito?.aliases,
  };
  if (!VALID_CLI_NAME.test(globalState.name)) {
    throw new Error(
      `Please use valid name for the CLI in your package.json (current: ${globalState.name}). Satisfying the constraint: ${VALID_CLI_NAME}`,
    );
  }

  return globalState;
};

/**
 * @param {{name: string; dir: string; version?: string }} globalState
 */
export const createGlobalStateFile = async (globalState) => {
  // create execution wrapper
  const file = path.join(buildDir, "meta.js");
  await fs.writeFile(
    file,
    `globalThis.__BROCOLITO__=${JSON.stringify(globalState)};\n`,
  );
};

/**
 * @param {string} name
 * @param {(file: string) => Promise<void>} createCb
 */
export const createBinFile = async (name, createCb) => {
  // create execution wrapper
  const binFile = path.join(binDir, name);
  await fs.mkdir(binDir, { recursive: true });
  await createCb(binFile);
  await fs.chmod(binFile, "744");
};

/**
 * @param {string} name
 * @param {Record<string, string> | undefined} aliases
 */
export const createCompletionFiles = async (name, aliases) => {
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
    bashCompletion
      .replaceAll(
        "BRO_ALIASES",
        aliases
          ? Object.keys(aliases)
              .map(
                (name) => `complete -o default -F _BRO_NAME_completion ${name}`,
              )
              .join("\n")
          : "",
      )
      .replaceAll("BRO_NAME", name),
  );
  await fs.writeFile(
    path.resolve("./build/zsh_completion.sh"),
    zshCompletion.replaceAll("BRO_NAME", name),
  );
};

/**
 * @param {string} name
 */
export const showSetupHint = (name) => {
  if (
    !process.env.CI &&
    !process.env.BROCOLITO_REBUILD &&
    !(/** @type {string} */ (process.env.PATH).split(":").includes(binDir))
  ) {
    console.log(`
To make the CLI ${name} globally accessible, you have to run this:
export PATH="${binDir}:$PATH"`);
  }
};

/**
 * @param {string[]} opts
 */
export const buildWithOpts = async (opts) => {
  if (!["node", "bun", "deno"].includes(opts[0])) {
    throw new Error(
      "Only supported runtimes are node, bun or deno. You passed: " + opts[0],
    );
  }

  const globalState = await getGlobalState();

  await createBinFile(globalState.name, (binFile) =>
    fs.writeFile(
      binFile,
      `#!/usr/bin/env ${opts.length > 1 ? "-S " : ""}${opts.join(" ")}

await import("../meta.js");
await import("../../src/main.ts");
`,
    ),
  );

  await createGlobalStateFile(globalState);

  await createCompletionFiles(globalState.name, globalState.aliases);
  showSetupHint(globalState.name);
};
