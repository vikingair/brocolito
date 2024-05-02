import { describe, it, expect, vi } from "vitest";
import { initEnv } from "../src/env";

initEnv();

describe("push changed_files", () => {
  it("returns changed files of given push event", async () => {
    // given
    process.env.GITHUB_REPOSITORY = "fdc-viktor-luft/brocolito";
    process.env.GITHUB_EVENT_NAME = "push";
    process.env.GITHUB_REF = "refs/heads/main";

    // load all modules with in env
    const module = await import("../src/files");

    // load changed files
    const changedFiles = await module.getChangedFiles("b5308cb5", "f103c367");

    expect(changedFiles).toEqual([
      ".github/cli/package.json",
      ".github/cli/pnpm-lock.yaml",
      ".github/cli/src/main.ts",
      ".github/workflows/pr.yml",
      ".github/workflows/push.yml",
    ]);

    // check printed tree
    const log = vi
      .spyOn(console, "log")
      .mockImplementationOnce(() => undefined);
    module.printFileTree(changedFiles);

    expect(log.mock.lastCall![0]).toMatchInlineSnapshot(`
      ".github
        cli
          src
            main.ts
          package.json
          pnpm-lock.yaml
        workflows
          pr.yml
          push.yml"
    `);
  });
});
