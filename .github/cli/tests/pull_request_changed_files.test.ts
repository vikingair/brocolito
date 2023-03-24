import { describe, it, expect, vi } from "vitest";
import { config } from "dotenv";

// load GITHUB_TOKEN locally
config({ path: ".env.local" });

describe("pull_request changed_files", () => {
  it("returns changed files of given pull_request event", async () => {
    // given
    process.env.GITHUB_REPOSITORY = "fdc-viktor-luft/brocolito";
    process.env.GITHUB_EVENT_NAME = "pull_request";
    process.env.GITHUB_EVENT_PATH = "./tests/pull_request_payload.json";

    // load all modules with in env
    const module = await import("../src/files");

    // load changed files
    const changedFiles = await module.getChangedFiles();

    expect(changedFiles).toEqual([
      ".github/cli/package.json",
      ".github/cli/pnpm-lock.yaml",
      "brocolito/bin/build.mjs",
      "brocolito/bin/run.cjs",
      "brocolito/package.json",
      "brocolito/src/brocolito.ts",
      "brocolito/vite.config.ts",
    ]);

    // check printed tree
    const log = vi
      .spyOn(console, "log")
      .mockImplementationOnce(() => undefined);
    module.printFileTree(changedFiles);

    expect(log.mock.lastCall![0]).toMatchInlineSnapshot(`
      ".github
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
        vite.config.ts"
    `);
  });
});
