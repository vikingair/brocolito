import { describe, it } from "node:test";
import process from "node:process";
import { initEnv } from "../src/env.ts";

initEnv();

describe("push changed_files", () => {
  it("returns changed files of given push event", async (t) => {
    // given
    process.env.GITHUB_REPOSITORY = "vikingair/brocolito";
    process.env.GITHUB_EVENT_NAME = "push";
    process.env.GITHUB_REF = "refs/heads/main";

    // load all modules with in env
    const module = await import("../src/files.ts");

    // load changed files
    const changedFiles = await module.getChangedFiles("b5308cb5", "f103c367");

    t.assert.deepEqual(changedFiles, [
      ".github/cli/package.json",
      ".github/cli/pnpm-lock.yaml",
      ".github/cli/src/main.ts",
      ".github/workflows/pr.yml",
      ".github/workflows/push.yml",
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
    src
      main.ts
    package.json
    pnpm-lock.yaml
  workflows
    pr.yml
    push.yml
    `.trim(),
    );
  });
});
