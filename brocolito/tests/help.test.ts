import { describe, it, expect, beforeEach } from "vitest";
import { State } from "../src/state";
import { _getHelp } from "../src/help";
import { CLI } from "../src/brocolito";

describe("help", () => {
  beforeEach(() => {
    State.commands = {};
  });

  it("prints top level help", () => {
    // given
    CLI.command("test", "this is a test");
    CLI.command("other-command", {
      description: "some magic to do?",
      alias: "oc",
    });

    // when / then
    expect(_getHelp()).toMatchInlineSnapshot(`
      "Usage:
        $ cli <command> [options]

      Commands:
        test            this is a test
        other-command   some magic to do? (alias: oc)
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

  it("prints command help with options", () => {
    CLI.command("test", "run a test")
      .option("--open", "some bool flag")
      .option("--file <file>", "some single file")
      .option("--more <args...>", "more args");

    expect(_getHelp(State.commands.test)).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test [options]

      Options:
        --open             some bool flag
        --file <file>      some single file
        --more <args...>   more args
      "
    `);
  });

  it("prints command with subcommands", () => {
    CLI.command("test", "run a test").subcommand(
      "one",
      "subcommand one here",
      (s) => s
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
            (s) => s
          )
          .option("--open", "some bool flag")
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
