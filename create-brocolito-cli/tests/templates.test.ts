import { describe, it, expect } from "vitest";
import { Templates } from "../src/templates";

describe("templates", () => {
  it("replaces the properties of the current package.json", () => {
    expect(JSON.parse(Templates.packageJson("foo"))).toEqual(
      expect.objectContaining({ name: "foo", bin: { foo: "./build/cli.cjs" } })
    );
  });
});
