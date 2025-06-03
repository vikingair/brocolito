import { beforeEach, describe, expect, it } from "vitest";
import { _completion } from "../src/completion/completion.ts";
import { State } from "../src/state.ts";
import { CLI } from "../src/brocolito.ts";
import { Tabtab } from "../src/completion/tabtab.ts";

const anyCallback: any = () => undefined;
const dummyDescription = "dummyDescription";

const getTabEnv = (line: string): any =>
  Tabtab.parseEnv({
    COMP_LINE: line,
    COMP_POINT: String(line.length),
    COMP_CWORD: String(line.split(" ").length),
  });

describe("completion", () => {
  beforeEach(() => {
    State.commands = {};
  });

  it("top-level completion", async () => {
    // empty commands
    expect(await _completion(getTabEnv("cli "))).toEqual(["--help"]);

    // some commands
    CLI.command("test", "test cmd here");
    CLI.command("other-command", "other cmd here");

    expect(await _completion(getTabEnv("cli "))).toEqual([
      { name: "test", description: "test cmd here" },
      { name: "other-command", description: "other cmd here" },
      "--help",
    ]);
  });

  it("started option", async () => {
    const expectedCompletedFlags = [
      { name: "--flag", description: dummyDescription },
      { name: "--file", description: "some file" },
      { name: "--str", description: "some string" },
      { name: "--union", description: "some mandatory union" },
      { name: "--inf", description: "some infinite string" },
    ];
    CLI.command("test", dummyDescription)
      .option("--flag|-f", dummyDescription)
      .option("--file <file>", "some file")
      .option("--str <string>", "some string")
      .option("--union|-u! <one|two>", "some mandatory union")
      .option("--inf <string...>", "some infinite string");

    // lists all until there is a space after the flad name
    expect(await _completion(getTabEnv("cli test --flag"))).toEqual(
      expectedCompletedFlags,
    );
    expect(await _completion(getTabEnv("cli test --flag "))).toEqual(
      expectedCompletedFlags.toSpliced(0, 1),
    );
    expect(await _completion(getTabEnv("cli test -f "))).toEqual(
      expectedCompletedFlags.toSpliced(0, 1),
    );
    expect(await _completion(getTabEnv("cli test --union one "))).toEqual(
      expectedCompletedFlags.toSpliced(3, 1),
    );
    // flag doesn't stop being suggested
    expect(await _completion(getTabEnv("cli test --inf whatever "))).toEqual(
      expectedCompletedFlags,
    );
    expect(await _completion(getTabEnv("cli test --file "))).toEqual([
      "__files__",
    ]);
    expect(await _completion(getTabEnv("cli test --union "))).toEqual([
      "one",
      "two",
    ]);
    expect(await _completion(getTabEnv("cli test -u "))).toEqual([
      "one",
      "two",
    ]);
    expect(await _completion(getTabEnv("cli test --str "))).toEqual([]);
  });

  it("started option with custom completion", async () => {
    const results = [
      "test",
      "two",
      { name: "three", description: "with description" },
    ];
    CLI.command("test", dummyDescription)
      .option("--foo <string>", dummyDescription, {
        completion: () => Promise.resolve(results),
      })
      .option("--file <file>", dummyDescription, {
        // if returning no results fallback to file completion
        completion: () => [],
      });

    // when custom completion for string with returned results
    expect(await _completion(getTabEnv("cli test --foo "))).toEqual(results);

    // when custom completion
    expect(await _completion(getTabEnv("cli test --file "))).toEqual([
      "__files__",
    ]);
  });

  it("arg with custom completion", async () => {
    const results = [
      "test",
      "two",
      { name: "three", description: "with description" },
    ];
    CLI.command("test", dummyDescription)
      .arg("<file:file>", dummyDescription, {
        // if returning no results fallback to file completion
        completion: () => [],
      })
      .arg("<string...>", dummyDescription, {
        completion: () => Promise.resolve(results),
      });

    // when custom completion for file with no results
    expect(await _completion(getTabEnv("cli test "))).toEqual(["__files__"]);

    // when custom completion for multi arg
    expect(await _completion(getTabEnv("cli test ./my/file "))).toEqual(
      results,
    );

    // when custom completion for multi arg second time
    expect(await _completion(getTabEnv("cli test ./my/file test "))).toEqual(
      results,
    );
  });

  it("filling args", async () => {
    CLI.command("test", dummyDescription)
      .arg("<arg1:file>", dummyDescription)
      .arg("<arg2:one|two>", dummyDescription)
      .arg("<arg3>", dummyDescription)
      .option("--flag", "some flag");

    expect(await _completion(getTabEnv("cli test"))).toEqual([
      {
        description: "dummyDescription",
        name: "test",
      },
      "--help",
    ]);
    expect(await _completion(getTabEnv("cli test "))).toEqual(["__files__"]);
    expect(await _completion(getTabEnv("cli test foo"))).toEqual(["__files__"]); // still returning files to navigate the file tree
    expect(await _completion(getTabEnv("cli test foo "))).toEqual([
      "one",
      "two",
    ]);
    expect(await _completion(getTabEnv("cli test foo bar"))).toEqual([
      "one",
      "two",
    ]); // still auto-completing the arg itself
    expect(await _completion(getTabEnv("cli test foo bar "))).toEqual([]);
    expect(await _completion(getTabEnv("cli test foo bar next"))).toEqual([]); // still auto-completing the arg itself
    expect(await _completion(getTabEnv("cli test foo bar next "))).toEqual([
      { name: "--flag", description: "some flag" },
    ]);
  });

  it("filling infinite union args", async () => {
    const opts = ["one", "two", "three"];
    CLI.command("test", dummyDescription)
      .arg("<arg1:one|two|three...>", dummyDescription)
      .option("--flag", "some flag");

    expect(await _completion(getTabEnv("cli test "))).toEqual(opts);
    expect(await _completion(getTabEnv("cli test foo"))).toEqual(opts);
    expect(await _completion(getTabEnv("cli test foo "))).toEqual(opts);
    expect(await _completion(getTabEnv("cli test foo bar "))).toEqual(opts);
  });

  it("filling subcommands and options", async () => {
    CLI.command("test", { description: dummyDescription, alias: "t" })
      .option("--flag", "some flag")
      .subcommand("one", { description: "sub cmd one", alias: "o" }, (s) =>
        s.option("--more", "more stuff").action(anyCallback),
      )
      .option("--other-flag", "some other flag")
      .subcommand("two", "sub cmd two", (s) => s.action(anyCallback));

    expect(await _completion(getTabEnv("cli test "))).toEqual([
      { name: "one", description: "sub cmd one" },
      { name: "two", description: "sub cmd two" },
    ]);
    expect(await _completion(getTabEnv("cli t "))).toEqual([
      { name: "one", description: "sub cmd one" },
      { name: "two", description: "sub cmd two" },
    ]);
    // stops suggesting subcommands when using options in between
    expect(await _completion(getTabEnv("cli t two --flag "))).toEqual([
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli test o "))).toEqual([
      { name: "--flag", description: "some flag" },
      { name: "--more", description: "more stuff" },
    ]);
    // does show all subcommands as long as there was no space entered
    expect(await _completion(getTabEnv("cli test two"))).toEqual([
      { name: "one", description: "sub cmd one" },
      { name: "two", description: "sub cmd two" },
    ]);
    expect(await _completion(getTabEnv("cli test two "))).toEqual([
      { name: "--flag", description: "some flag" },
      { name: "--other-flag", description: "some other flag" },
    ]);
    // we prevent that subcommands can be used after options have been declared
    expect(await _completion(getTabEnv("cli test two --flag "))).toEqual([
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli t o --flag "))).toEqual([
      { name: "--more", description: "more stuff" },
    ]);
  });
});
