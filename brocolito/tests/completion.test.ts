import { describe, it, expect, beforeEach } from "vitest";
import { _completion } from "../src/completion/completion";
import { State } from "../src/state";
import { CLI } from "../src/brocolito";

const anyCallback: any = () => undefined;
const dummyDescription = "dummyDescription";

const getTabEnv = (line: string): any => {
  const prev = line.split(" ").filter(Boolean).at(-1) || "";
  return { prev, line };
};

describe("completion", () => {
  beforeEach(() => {
    State.commands = {};
  });

  it("top-level completion", async () => {
    // empty commands
    expect(await _completion(getTabEnv("cli"))).toEqual(["--help"]);

    // some commands
    CLI.command("test", "test cmd here");
    CLI.command("other-command", "other cmd here");

    expect(await _completion(getTabEnv("cli"))).toEqual([
      { name: "test", description: "test cmd here" },
      { name: "other-command", description: "other cmd here" },
      "--help",
    ]);
  });

  it("started option", async () => {
    State.commands = {};
    CLI.command("test", dummyDescription)
      .option("--flag", dummyDescription)
      .option("--file <file>", "some file")
      .option("--str <string>", "some string");

    expect(await _completion(getTabEnv("cli test --flag"))).toEqual([
      { name: "--file", description: "some file" },
      { name: "--str", description: "some string" },
    ]);
    expect(await _completion(getTabEnv("cli test --file"))).toEqual([
      "__files__",
    ]);
    expect(await _completion(getTabEnv("cli test --str"))).toEqual([]);
  });

  it("filling args", async () => {
    CLI.command("test", dummyDescription)
      .arg("<file:arg1>", dummyDescription)
      .arg("<arg2>", dummyDescription)
      .option("--flag", "some flag");

    expect(await _completion(getTabEnv("cli test"))).toEqual([]);
    expect(await _completion(getTabEnv("cli test "))).toEqual(["__files__"]);
    expect(await _completion(getTabEnv("cli test foo"))).toEqual(["__files__"]); // still returning files to navigate the file tree
    expect(await _completion(getTabEnv("cli test foo "))).toEqual([]);
    expect(await _completion(getTabEnv("cli test foo bar"))).toEqual([]); // still auto-completing the arg itself
    expect(await _completion(getTabEnv("cli test foo bar "))).toEqual([
      { name: "--flag", description: "some flag" },
    ]);
  });

  it("filling subcommands and options", async () => {
    CLI.command("test", { description: dummyDescription, alias: "t" })
      .option("--flag", "some flag")
      .subcommand("one", { description: "sub cmd one", alias: "o" }, (s) =>
        s.option("--more", "more stuff").action(anyCallback),
      )
      .option("--other-flag", "some other flag")
      .subcommand("two", "sub cmd two", (s) => s.action(anyCallback));

    expect(await _completion(getTabEnv("cli test"))).toEqual([
      { name: "one", description: "sub cmd one" },
      { name: "two", description: "sub cmd two" },
      { name: "--flag", description: "some flag" },
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli t"))).toEqual([
      { name: "one", description: "sub cmd one" },
      { name: "two", description: "sub cmd two" },
      { name: "--flag", description: "some flag" },
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli test o"))).toEqual([
      { name: "--flag", description: "some flag" },
      { name: "--more", description: "more stuff" },
    ]);
    expect(await _completion(getTabEnv("cli test two"))).toEqual([
      { name: "--flag", description: "some flag" },
      { name: "--other-flag", description: "some other flag" },
    ]);
    // we prevent that subcommands can be used after options have been declared
    expect(await _completion(getTabEnv("cli test --flag"))).toEqual([
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli t o --flag"))).toEqual([
      { name: "--more", description: "more stuff" },
    ]);
  });
});
