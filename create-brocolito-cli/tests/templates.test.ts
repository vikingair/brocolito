import { describe, it, expect } from "vitest";
import { Templates } from "../src/templates";

describe("templates", () => {
  it("replaces the properties of the current package.json (runtime: node)", () => {
    expect(JSON.parse(Templates.packageJson("foo", "node"))).toEqual(
      expect.objectContaining({
        name: "foo",
        bin: { foo: "./build/cli.cjs" },
        scripts: expect.objectContaining({ build: "brocolito" }),
      }),
    );
  });

  it("replaces the properties of the current package.json (runtime: bun)", () => {
    expect(JSON.parse(Templates.packageJson("foo", "bun"))).toEqual(
      expect.objectContaining({
        name: "foo",
        bin: { foo: "./build/cli.cjs" },
        scripts: expect.objectContaining({
          build: "brocolito-bun",
          test: "bun test",
        }),
      }),
    );
  });
});
