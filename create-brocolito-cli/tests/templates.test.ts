import { describe, it, expect } from "vitest";
import { Templates } from "../src/templates";

describe("templates", () => {
  it.each([
    {
      runtime: "node",
      testFramework: "vitest",
      prepare: "brocolito node --experimental-strip-types --no-warnings",
      test: "vitest run",
    },
    {
      runtime: "node",
      testFramework: "runtime",
      prepare: "brocolito node --experimental-strip-types --no-warnings",
      test: "node --experimental-strip-types --no-warnings --test",
    },
    {
      runtime: "bun",
      testFramework: "vitest",
      prepare: "brocolito bun",
      test: "vitest run",
    },
    {
      runtime: "bun",
      testFramework: "runtime",
      prepare: "brocolito bun",
      test: "bun test",
    },
  ] as const)(
    "replaces the properties of the current package.json (runtime: $runtime, testFramework: $testFramework)",
    ({ runtime, testFramework, prepare, test }) => {
      expect(
        Templates.packageJson("foo", runtime, testFramework).content,
      ).toEqual(
        expect.objectContaining({
          name: "foo",
          bin: { foo: "./build/cli.js" },
          scripts: expect.objectContaining({ prepare, test }),
        }),
      );
    },
  );
});
