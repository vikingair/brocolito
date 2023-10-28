import { describe, it, vi, expect, beforeEach } from "vitest";
import { CLI } from "../src/brocolito";
import { State } from "../src/state";
import { Utils } from "../src/utils";
import { Help } from "../src/help";

const call = (line: string) =>
  CLI.parse(["nodeFile", "scriptFile"].concat(line.split(" ")));

describe("Example commands", () => {
  beforeEach(() => {
    State.commands = {};
  });

  it("Simple command without options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example-1", "example-1-description").action(spy);

    // when
    await call("example-1");

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
    CLI.command("example-2", "example-2-description")
      .subcommand("foo", "foo-desc", (foo) => {
        foo.action(fooSpy);
      })
      .subcommand("bar", "bar-desc", (bar) => {
        bar.action(barSpy);
      });

    // when
    await call("example-2 bar");

    // then
    expect(fooSpy).not.toHaveBeenCalled();
    expect(barSpy).toHaveBeenCalledOnce();
  });

  it("Two level subcommands", async () => {
    // given
    const spy = vi.fn();
    const fooSpy = vi.fn();
    const barSpy = vi.fn();
    CLI.command("example-3", "example-3-description")
      .subcommand("foo", { description: "foo-desc", alias: "f" }, (foo) => {
        foo
          .subcommand("bar", "bar-desc", (bar) => {
            bar.action(barSpy);
          })
          .action(fooSpy);
      })
      .action(spy);

    // when
    await call("example-3");

    // then
    expect(spy).toHaveBeenCalledOnce();
    expect(fooSpy).not.toHaveBeenCalled();
    expect(barSpy).not.toHaveBeenCalled();

    // when
    vi.resetAllMocks();
    call("example-3 f");

    // then
    expect(spy).not.toHaveBeenCalled();
    expect(fooSpy).toHaveBeenCalledOnce();
    expect(barSpy).not.toHaveBeenCalled();

    // when
    vi.resetAllMocks();
    call("example-3 foo bar");

    // then
    expect(spy).not.toHaveBeenCalled();
    expect(fooSpy).not.toHaveBeenCalled();
    expect(barSpy).toHaveBeenCalledOnce();
  });

  it("parses options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example-4", "example-4-description")
      .option("--test <test_arg>", "test option")
      .option("--some-more", "some-more option")
      .action(({ test, someMore, ...rest }) =>
        spy({ test, someMore, ...rest }),
      );

    // when - called with no options
    await call("example-4");

    // then
    expect(spy).toHaveBeenCalledWith({ someMore: false });

    // when
    spy.mockReset();
    await call("example-4 --test foo --some-more=false");

    // then
    expect(spy).toHaveBeenCalledWith({ test: "foo", someMore: false });

    // when - called with invalid options
    await expect(() => call("example-4 --invalid=foo")).rejects.toThrow(
      "Unrecognized options were used: --invalid",
    );

    // when - called with invalid flag value
    await expect(() => call("example-4 --some-more=foo")).rejects.toThrow(
      'Invalid value "foo" provided for flag --some-more',
    );

    // when - called with invalid options and valid options
    await expect(() =>
      call("example-4 --invalid=foo --test foo --what else"),
    ).rejects.toThrow("Unrecognized options were used: --invalid, --what");
  });

  it("parses args and options", async () => {
    // given
    const spy = vi.fn();
    CLI.command("example-5", "example-5-description")
      .option("--open", "test option")
      .arg("<test-arg>", "some-more option")
      .option("--test <param>", "test option")
      .arg("<test-multi...>", "some-more option")
      .action(({ test, testArg, open, testMulti, ...rest }) => {
        spy({ test, testArg, open, testMulti, ...rest });
      });

    // when
    await call("example-5 ./some/path hot hotter lotta --test=ups --open");

    // then
    expect(spy).toHaveBeenCalledWith({
      test: "ups",
      open: true,
      testArg: "./some/path",
      testMulti: ["hot", "hotter", "lotta"],
    });

    // when
    await call("example-5 --open=false foo bar");

    // then
    expect(spy).toHaveBeenCalledWith({
      testArg: "foo",
      testMulti: ["bar"],
      open: false,
    });
  });

  it("parses subcommands and options", async () => {
    // given
    const spy = vi.fn();
    const subcommandSpy = vi.fn();
    CLI.command("example-6", "example-6-description")
      .option("--open", "test option")
      .subcommand("foo", "foo-desc", (foo) => {
        foo
          .option("--nice <string>", "nice option")
          .action(({ open, nice, ...rest }) =>
            subcommandSpy({ open, nice, ...rest }),
          );
      })
      .option("--test <param>", "test option")
      .action(({ test, open, ...rest }) => {
        spy({ test, open, ...rest });
      });

    // when
    await call("example-6 --open --test ups");

    // then
    expect(spy).toHaveBeenCalledWith({
      test: "ups",
      open: true,
    });

    // when - calling the sub command
    await call("example-6 foo --open=false --nice ups");

    // then
    expect(subcommandSpy).toHaveBeenCalledWith({ nice: "ups", open: false });
  });

  it("parses subcommands, args and options", async () => {
    // given
    const subcommandSpy = vi.fn();
    CLI.command("example-7", "example-7-description")
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
    await call("example-7 --nice try foo hot --open=false");

    // then
    expect(subcommandSpy).toHaveBeenCalledWith({
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
    CLI.command("example-8", "example-8-description")
      .arg("<$>", "any")
      .action(commandSpy);

    // when
    await expect(() => call("example-8 soemthing invalid")).rejects.toThrow(
      `Too many arguments given: Expected 1 arguments, but was invoked with 2.
The following arguments could not be processed: ${Utils.pc.yellow("invalid")}`,
    );

    // then
    expect(commandSpy).not.toBeCalled();
    expect(subcommandSpy).not.toBeCalled();
    expect(helpSpy).toBeCalled();
  });

  it("complains when being called with wrong amount of arguments", async () => {
    // given
    const commandSpy = vi.fn();
    const subcommandSpy = vi.fn();
    const helpSpy = vi.spyOn(Help, "show").mockReturnValue();
    CLI.command("example-9", "example-9-description")
      .subcommand("foo", "foo-desc", (foo) => foo.action(subcommandSpy))
      .subcommand("bar", "foo-desc", (foo) => foo.action(subcommandSpy))
      .action(commandSpy);

    // when
    await expect(() => call("example-9 invalid")).rejects.toThrow(
      `Unknown subcommand ${Utils.pc.yellow("invalid")} specified.`,
    );

    // then
    expect(commandSpy).not.toBeCalled();
    expect(subcommandSpy).not.toBeCalled();
    expect(helpSpy).toBeCalled();
  });
});
