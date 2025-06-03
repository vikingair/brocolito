import { beforeEach, describe, expect, it, vi } from "vitest";
import { CLI } from "../src/brocolito.ts";
import { State } from "../src/state.ts";
import pc from "picocolors";
import { Help } from "../src/help.ts";

const call = (line: string) =>
  CLI.parse(["nodeFile", "scriptFile"].concat(line.split(" ")));

describe("Example commands", () => {
  beforeEach(() => {
    State.commands = {};
  });

  it("Simple command without options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example", "example-description").action(spy);

    // when
    await call("example");

    // then
    expect(spy).toHaveBeenCalledOnce();
  });

  it("command with alias", async () => {
    // given
    const spy = vi.fn();
    CLI.command("foo", { description: "foo", alias: "f" }).action(spy);

    // when
    await call("f");

    // then
    expect(spy).toHaveBeenCalledOnce();
  });

  it("Subcommand", async () => {
    // given
    const fooSpy = vi.fn();
    const barSpy = vi.fn();
    CLI.command("example", "example-description")
      .subcommand("foo", "foo-desc", (foo) => {
        foo.action(fooSpy);
      })
      .subcommand("bar", "bar-desc", (bar) => {
        bar.action(barSpy);
      });

    // when
    await call("example bar");

    // then
    expect(fooSpy).not.toBeCalled();
    expect(barSpy).toHaveBeenCalledOnce();
  });

  it("Two level subcommands", async () => {
    // given
    const spy = vi.fn();
    const help = vi.spyOn(Help, "show").mockReturnValue();
    CLI.command("example", "example-description").subcommand(
      "foo",
      { description: "foo-desc", alias: "f" },
      (foo) => {
        foo.subcommand("bar", "bar-desc", (bar) => {
          bar.action(spy);
        });
      },
    );

    // when
    await expect(call("example")).rejects.toThrow(
      "Specify a subcommand to be used.",
    );

    // then
    expect(spy).not.toBeCalled();
    expect(help).toBeCalled();

    // when
    vi.resetAllMocks();
    call("example f bar");

    // then
    expect(spy).toBeCalled();

    // when
    vi.resetAllMocks();
    call("example foo bar");

    // then
    expect(spy).toBeCalled();
  });

  it("parses options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example", "example-description")
      .option("--test <string>", "test option")
      .option("--some-more|-s", "some-more option")
      .action(({ test, someMore, ...rest }) =>
        spy({ test, someMore, ...rest }),
      );

    // when - called with no options
    await call("example");

    // then
    expect(spy).toBeCalledWith({ someMore: false });

    // when - called with no options
    spy.mockReset();
    await call("example -s");

    // then
    expect(spy).toBeCalledWith({ someMore: true });

    // when
    spy.mockReset();
    await call("example --test foo --some-more=false");

    // then
    expect(spy).toBeCalledWith({ test: "foo", someMore: false });

    // when - called with invalid options
    await expect(() => call("example --invalid=foo")).rejects.toThrow(
      "Unrecognized options were used: --invalid",
    );

    // when - called with invalid flag value
    await expect(() => call("example --some-more=foo")).rejects.toThrow(
      'Invalid value "foo" provided for flag --some-more',
    );

    // when - called with invalid options and valid options
    await expect(() =>
      call("example --invalid=foo --test foo --what else"),
    ).rejects.toThrow("Unrecognized options were used: --invalid, --what");
  });

  it("using mandatory options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example", "example-description")
      .option("--test|-t! <string>", "test option")
      .action(({ test, ...rest }) => spy({ test, ...rest }));

    // when - called without the mandatory option
    await expect(() => call("example")).rejects.toThrow(
      "Mandatory options was not provided: --test",
    );

    // when - called with option
    await call("example -t foo");

    // then
    expect(spy).toBeCalledWith({ test: "foo" });
  });

  it("using multi options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example", "example-description")
      .option("--test <file...>", "test option")
      .option("--non-multi <string>", "will consider only last")
      .action(({ test, nonMulti, ...rest }) =>
        spy({ test, nonMulti, ...rest }),
      );

    // when - called with no options
    await call("example");

    // then
    expect(spy).toBeCalledWith({ test: undefined });

    // when - called with single entry
    await call("example --test foo --non-multi one --non-multi two");

    // then
    expect(spy).toBeCalledWith({ test: ["foo"], nonMulti: "two" });

    // when - called with multiple entries
    await call("example --test foo --test bar");

    // then
    expect(spy).toBeCalledWith({ test: ["foo", "bar"] });
  });

  it("using union options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example", "example-description")
      .option("--test <foo>", "test option with single allowed value")
      .option("--test-multi <one|two...>", "test option with multi")
      .action(({ test, testMulti, ...rest }) =>
        spy({ test, testMulti, ...rest }),
      );

    // when - called with no options
    await call("example");

    // then
    expect(spy).toBeCalledWith({});

    // when - called with string not matching union constraints
    await expect(() => call("example --test bar")).rejects.toThrow(
      'Invalid value "bar" provided for flag --test. Must be one of: foo',
    );

    // when - called with single matching option
    await call("example --test foo");

    // then
    expect(spy).toBeCalledWith({ test: "foo" });

    // when - called with string not matching union constraints
    await expect(() =>
      call("example --test-multi one --test-multi ups"),
    ).rejects.toThrow(
      'Invalid value "ups" provided for flag --test-multi. Must be one of: one | two',
    );

    // when - called with valid multiple entries
    await call("example --test-multi one --test-multi two");

    // then
    expect(spy).toBeCalledWith({ testMulti: ["one", "two"] });
  });

  it("using union args", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example", "example-description")
      .arg("<test:foo>", "test arg")
      .arg("<test-multi:one|two...>", "test multi arg")
      .action(({ test, testMulti, ...rest }) =>
        spy({ test, testMulti, ...rest }),
      );

    // when - called with string not matching union constraints
    await expect(() => call("example bar one")).rejects.toThrow(
      'Invalid value "bar" provided for arg <test:foo>.',
    );

    // when - called with single matching option allowing empty multi args
    await call("example foo one");

    // then
    expect(spy).toBeCalledWith({ test: "foo", testMulti: ["one"] });

    // when - called with string not matching union constraints
    await expect(() => call("example foo one ups")).rejects.toThrow(
      'Invalid value "ups" provided for arg <test-multi:one|two...>',
    );

    // when - called with valid multiple entries
    await call("example foo one two");

    // then
    expect(spy).toBeCalledWith({
      test: "foo",
      testMulti: ["one", "two"],
    });
  });

  it("parses args and options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example", "example-description")
      .option("--open", "test option")
      .arg("<test-arg>", "some-more option")
      .option("--test <string>", "test option")
      .arg("<test-multi...>", "some-more option")
      .action(({ test, testArg, open, testMulti, ...rest }) => {
        spy({ test, testArg, open, testMulti, ...rest });
      });

    // when
    await call("example ./some/path hot hotter lotta --test=ups --open");

    // then
    expect(spy).toBeCalledWith({
      test: "ups",
      open: true,
      testArg: "./some/path",
      testMulti: ["hot", "hotter", "lotta"],
    });

    // when
    await call("example --open=false foo bar");

    // then
    expect(spy).toBeCalledWith({
      testArg: "foo",
      testMulti: ["bar"],
      open: false,
    });
  });

  it("parses subcommands and options", async () => {
    // given
    const fooSpy = vi.fn();
    const barSpy = vi.fn();
    CLI.command("example", "example-description")
      .option("--open", "test option")
      .subcommand("foo", "foo-desc", (foo) => {
        foo
          .option("--nice <string>", "nice option")
          .action(({ open, nice, ...rest }) => fooSpy({ open, nice, ...rest }));
      })
      .subcommand("bar", "bar-desc", (foo) => {
        foo
          .option("--test <string>", "test option")
          .action(({ test, open, ...rest }) => {
            barSpy({ test, open, ...rest });
          });
      });

    // when
    await call("example bar --open --test ups");

    // then
    expect(barSpy).toBeCalledWith({ test: "ups", open: true });

    // when - calling the sub command
    await call("example foo --open=false --nice ups");

    // then
    expect(fooSpy).toBeCalledWith({ nice: "ups", open: false });
  });

  it("parses subcommands, args and options", async () => {
    // given
    const subcommandSpy = vi.fn();
    CLI.command("example", "example-description")
      .option("--open", "test option")
      .subcommand("foo", "foo-desc", (foo) => {
        foo
          .arg("<what>", "test desc")
          .option("--nice <string>", "nice option")
          .action(({ open, what, ...rest }) =>
            subcommandSpy({ open, what, ...rest }),
          );
      });

    // when
    await call("example foo hot --nice try --open=false");

    // then
    expect(subcommandSpy).toBeCalledWith({
      what: "hot",
      open: false,
      nice: "try",
    });
  });

  it("complains when being called with wrong amount of arguments", async () => {
    // given
    const commandSpy = vi.fn();
    const subcommandSpy = vi.fn();
    const helpSpy = vi.spyOn(Help, "show").mockReturnValue();
    CLI.command("example", "example-description")
      .arg("<a>", "any")
      .action(commandSpy);

    // when
    await expect(() => call("example soemthing invalid")).rejects.toThrow(
      `Too many arguments given: Expected 1 arguments, but was invoked with 2.
The following arguments could not be processed: ${pc.yellow("invalid")}`,
    );

    // then
    expect(commandSpy).not.toBeCalled();
    expect(subcommandSpy).not.toBeCalled();
    expect(helpSpy).toBeCalled();
  });

  it("complains when being called with invalid subcommand", async () => {
    // given
    const subcommandSpy = vi.fn();
    const helpSpy = vi.spyOn(Help, "show").mockReturnValue();
    CLI.command("example", "example-description")
      .subcommand("foo", "foo-desc", (foo) => foo.action(subcommandSpy))
      .subcommand("bar", "foo-desc", (foo) => foo.action(subcommandSpy));

    // when
    await expect(() => call("example invalid")).rejects.toThrow(
      `Unknown subcommand ${pc.yellow("invalid")} specified.`,
    );

    // then
    expect(subcommandSpy).not.toBeCalled();
    expect(helpSpy).toBeCalled();
  });

  it("complains when accessing unspecifed options or args or actions", async () => {
    CLI.command("example", "example-description")
      // @ts-expect-error using param that doesn't exist.
      .action(({ foo }) => {
        if (foo) {
          // do nothing
        }
      });

    CLI.command("example", "example-description")
      .subcommand("foo", "foo-desc", () => undefined)
      // @ts-expect-error action not supported when using subcommands
      .action(() => undefined);

    expect(() => {
      CLI.command("example", "example-description")
        // @ts-expect-error option doesn't start with "--"
        .option("-f", "does not matter");
    }).toThrow(
      "Invalid usage specified for option '-f'. Required pattern: --[a-z0-9-]+(|-[a-z])?!?( .+)?",
    );

    expect(() => {
      CLI.command("example", "example-description")
        // @ts-expect-error arg is not wrapped with "<>"
        .arg("ups", "does not matter");
    }).toThrow(
      "Invalid usage specified for arg 'ups'. Required pattern: <[a-z0-9-]+(\\.{3})?>",
    );
  });
});
