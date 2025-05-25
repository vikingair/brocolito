import { beforeEach, describe, expect, it } from "vitest";
import { State } from "../src/state.ts";
import { _getHelp } from "../src/help.ts";
import { CLI } from "../src/brocolito.ts";

describe("help", () => {
  beforeEach(() => {
    State.commands = {};
  });

  it("prints top level help", () => {
    // given
    CLI.command("test", "this is a test");
    CLI.command("magic-command", {
      description: "some magic to do?",
      alias: "mc",
    });
    CLI.command("other-command", {
      description: "Various things\nor no things",
      alias: "oc",
    });

    // when / then
    expect(_getHelp()).toMatchInlineSnapshot(`
      "Usage:
        $ cli <command> [options]

      Commands:
        test            this is a test
        magic-command   some magic to do? (alias: mc)
        other-command   Various things
                        or no things (alias: oc)
      "
    `);
  });

  it("prints command help", () => {
    CLI.command("test", "run a test");
    expect(_getHelp(State.commands.test)).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test
      "
    `);
  });

  it("prints command help with args", () => {
    CLI.command("test", "run a test")
      .arg("<foo>", "foo arg")
      .arg("<bar:file>", "bar arg with file\nanother line")
      .arg("<test:one|two>", "test arg with fixed values")
      .arg("<test-two:single>", "test arg with single possible value")
      .arg("<more...>", "more args")
      .action(({ foo, bar, test, testTwo, more }) => {
        const a1: string = foo;
        const a2: string = bar;
        const a3: "one" | "two" = test;
        const a4: "single" = testTwo;
        const a5: string[] = more;
        return a1 || a2 || a3 || a4 || a5;
      });

    expect(_getHelp(State.commands.test)).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test <foo> <bar:file> <test:one|two> <test-two:single> <more...>

      Args:
        <foo>               foo arg
        <bar:file>          bar arg with file
                            another line
        <test:one|two>      test arg with fixed values
        <test-two:single>   test arg with single possible value
        <more...>           more args
      "
    `);
  });

  it("prints command help with args and options", () => {
    CLI.command("test", "run a test")
      .option("--open", "some bool flag")
      .arg("<foo>", "foo arg");

    expect(_getHelp(State.commands.test)).toMatchInlineSnapshot(`
    "Help:
      run a test

    Usage:
      $ cli test <foo> [options]

    Args:
      <foo>   foo arg

    Options:
      --open   some bool flag
    "
  `);
  });

  it("prints command help with options", () => {
    CLI.command("test", "run a test")
      .option("--open", "some bool flag")
      .option("--file <file>", "some single file")
      .option("--file-two! <file>", "some single mandatory file")
      .option("--more <string...>", "more args")
      .option("--more-two! <string...>", "more mandatory args")
      .action(({ open, file, fileTwo, more, moreTwo }) => {
        const a1: boolean = open;
        const a2: string | undefined = file;
        const a3: string = fileTwo;
        const a4: string[] | undefined = more;
        const a5: string[] = moreTwo;
        return a1 || a2 || a3 || a4 || a5;
      });

    expect(_getHelp(State.commands.test)).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test [options]

      Options:
        --open                    some bool flag
        --file <file>             some single file
        --file-two! <file>        some single mandatory file
        --more <string...>        more args
        --more-two! <string...>   more mandatory args
      "
    `);
  });

  it("prints command with subcommands", () => {
    CLI.command("test", "run a test").subcommand(
      "one",
      "subcommand one here",
      (s) => s,
    );

    expect(_getHelp(State.commands.test)).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test <command> [options]

      Commands:
        one   subcommand one here
      "
    `);
  });

  it("prints subcommand", () => {
    CLI.command("test", "run a test").subcommand(
      "one",
      "subcommand one here",
      (s) =>
        s
          .subcommand(
            "two",
            { description: "subcommand two here", alias: "t" },
            (s) => s.action(() => undefined),
          )
          .option("--open", "some bool flag"),
    );
    expect(_getHelp(State.commands.test.subcommands.one))
      .toMatchInlineSnapshot(`
      "Help:
        subcommand one here

      Usage:
        $ cli test one <command> [options]

      Commands:
        two   subcommand two here (alias: t)

      Options:
        --open   some bool flag
      "
    `);
  });
});
