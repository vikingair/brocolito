import { describe, it } from "node:test";
import process from "node:process";
import { initEnv } from "../src/env.ts";

initEnv();

describe("pull_request changed_files", () => {
  it("returns changed files of given pull_request event", async (t) => {
    // given
    process.env.GITHUB_REPOSITORY = "vikingair/brocolito";
    process.env.GITHUB_EVENT_NAME = "pull_request";
    process.env.GITHUB_EVENT_PATH = "./tests/pull_request_payload.json";

    // load all modules with in env
    const module = await import("../src/files.ts");

    // load changed files
    const changedFiles = await module.getChangedFiles();

    t.assert.deepEqual(changedFiles, [
      ".github/cli/package.json",
      ".github/cli/pnpm-lock.yaml",
      "brocolito/bin/build.mjs",
      "brocolito/bin/run.cjs",
      "brocolito/package.json",
      "brocolito/src/brocolito.ts",
      "brocolito/vite.config.ts",
    ]);

    // check printed tree
    const log = t.mock.method(console, "log");
    log.mock.mockImplementation(() => undefined);
    module.printFileTree(changedFiles);

    t.assert.equal(
      log.mock.calls.at(-1)!.arguments[0],
      `
.github
  cli
    package.json
    pnpm-lock.yaml
brocolito
  bin
    build.mjs
    run.cjs
  src
    brocolito.ts
  package.json
  vite.config.ts
    `.trim(),
    );
  });
});
