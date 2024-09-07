import { describe, it, expect } from "vitest";
import { Arguments } from "../src/arguments";
import { ArgType } from "../src/types";

describe("arguments", () => {
  it.each<{
    usage: string;
    name: string;
    mandatory?: boolean;
    multi?: boolean;
    type: ArgType["type"] | "boolean";
  }>([
    { usage: "--flag", type: "boolean", name: "flag" },
    { usage: "--foo <string>", type: "string", name: "foo" },
    { usage: "--foo <string...>", type: "string", name: "foo", multi: true },
    { usage: "--foo <one|two>", type: ["one", "two"], name: "foo" },
    {
      usage: "--foo! <one|two...>",
      type: ["one", "two"],
      name: "foo",
      mandatory: true,
      multi: true,
    },
    { usage: "--foo something", type: "string", name: "foo" },
    { usage: "--foo! something", type: "string", name: "foo", mandatory: true },
    { usage: "--foo! <file>", type: "file", name: "foo", mandatory: true },
  ])(
    "parses argument info for option with usage '$usage'",
    ({ usage, name, type, mandatory = false, multi = false }) => {
      expect(Arguments.deriveOptionInfo(usage)).toEqual({
        mandatory,
        multi,
        type,
        name,
        prefixedName: "--" + name,
      });
    },
  );

  it.each<{
    usage: string;
    multi?: boolean;
    type: ArgType["type"] | "boolean";
  }>([
    { usage: "<foo>", type: "string" },
    { usage: "<foo...>", type: "string", multi: true },
    { usage: "<foo:string>", type: "string" },
    { usage: "<foo:string...>", type: "string", multi: true },
    { usage: "<foo:one|two>", type: ["one", "two"] },
    { usage: "<foo:one|two...>", type: ["one", "two"], multi: true },
    { usage: "something", type: "string" },
    { usage: "<foo:file>", type: "file" },
    { usage: "<foo:file...>", type: "file", multi: true },
  ])(
    "parses argument info with usage '$usage'",
    ({ usage, type, multi = false }) => {
      expect(Arguments.deriveInfo(usage)).toEqual({
        multi,
        type,
      });
    },
  );
});
