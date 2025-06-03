import { describe, it, expect } from "vitest";
import { Templates } from "../src/templates";

describe("templates", () => {
  it("replaces the properties of the current package.json (runtime: node)", () => {
    expect(Templates.packageJson("foo", "node", "vitest").content).toEqual(
      expect.objectContaining({
        name: "foo",
        bin: { foo: "./build/cli.js" },
        scripts: expect.objectContaining({ prepare: "brocolito" }),
      }),
    );
  });

  it("replaces the properties of the current package.json (runtime: bun)", () => {
    expect(Templates.packageJson("foo", "bun", "vitest").content).toEqual(
      expect.objectContaining({
        name: "foo",
        bin: { foo: "./build/cli.js" },
        scripts: expect.objectContaining({
          prepare: "brocolito bun",
          test: "bun test",
        }),
      }),
    );
  });
});
