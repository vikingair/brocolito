import {
  Action,
  ArgumentArg,
  Command,
  DescriptionOrOpts,
  OptionArg,
  OptionToName,
  Subcommand,
} from "./types";
import { State } from "./state";
import { parse } from "./parse";
import { Utils } from "./utils";
import { Arguments } from "./arguments";
import { Meta } from "./meta";

process.on("unhandledRejection", (err) => {
  const errMsg =
    err instanceof Error ? (process.env.DEBUG ? err.stack : err.message) : err;
  complainAndExit(String(errMsg));
});

const createAction =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>) =>
  (a: Action<OPTIONS & ARGS>): void => {
    command._action = a;
  };

const createOption =
  <OPTIONS, ARGS, WITH_ARGS>(command: Command<OPTIONS, ARGS, WITH_ARGS>) =>
  <USAGE extends `--${string}`>(
    usage: USAGE,
    description: string
  ): Command<OPTIONS & OptionArg<USAGE>, ARGS, WITH_ARGS> => {
    const newCommand = command as Command<
      OPTIONS & OptionArg<USAGE>,
      ARGS,
      WITH_ARGS
    >;
    const { name, prefixedName, type } = Arguments.deriveOptionInfo(usage);

    newCommand.options[Arguments.camelize(name) as OptionToName<USAGE>] = {
      usage,
      name,
      prefixedName,
      description,
      type,
    };
    return newCommand;
  };

const createSubcommand =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>): Subcommand<OPTIONS, ARGS> =>
  (name, options, cb): Command<OPTIONS, ARGS, false> => {
    const opts =
      typeof options === "string" ? { description: options } : options;
    const subcommand = {
      ...command,
      name,
      line: `${command.line} ${name}`,
      args: [],
      description: opts.description,
      alias: opts.alias,
      options: { ...command.options },
    } as unknown as Command<OPTIONS>;
    subcommand.arg = createArg(subcommand);
    subcommand.action = createAction(subcommand);
    subcommand.option = createOption(subcommand);
    subcommand.subcommand = createSubcommand(subcommand);
    subcommand.subcommands = {};
    command.subcommands[name] = subcommand;
    cb(subcommand);
    // return parent command, sub command will be further processed in cb
    const { arg: _, args: __, ...rest } = command;
    return rest as unknown as Command<OPTIONS, ARGS, false>;
  };

const createArg =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>) =>
  <USAGE extends `<${string}>`>(
    usage: USAGE,
    description: string
  ): Command<OPTIONS, ARGS & ArgumentArg<USAGE>, true> => {
    const { subcommand: _, subcommands: __, ...newCommand } = command;
    const name = Arguments.toName(usage);
    newCommand.args.push({ usage, name, description });
    return newCommand as unknown as Command<
      OPTIONS,
      ARGS & ArgumentArg<USAGE>,
      true
    >;
  };

const command = (name: string, options: DescriptionOrOpts): Command => {
  const opts = typeof options === "string" ? { description: options } : options;
  const command: Command = {
    name,
    line: name,
    description: opts.description,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    action: null!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    arg: null!,
    args: [],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    option: null!,
    options: [],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    subcommand: null!,
    subcommands: {},
    alias: opts.alias,
  };
  command.action = createAction(command);
  command.arg = createArg(command);
  command.option = createOption(command);
  command.subcommand = createSubcommand(command);
  State.commands[name] = command;
  return command;
};

const alias = (aliasName: string, replacement: string) => {
  State.aliases[aliasName] = replacement;
};

// TODO: README update
// TODO: Option aliases
// TODO: Option parser
// TODO: Argument parser
// TODO: Instructions for publishing
// TODO: create-brocolito-cli
export const CLI = { command, parse, _state: State, alias, meta: Meta };

// Utility re-exported (no additional installation required for the peer)
const { pc, complainAndExit, prompts } = Utils;
export { pc, complainAndExit, prompts };
