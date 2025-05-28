import type {
  Action,
  ArgStates,
  ArgumentArg,
  Command,
  CompletionOpt,
  DescriptionOrOpts,
  OptionArg,
  OptionToName,
  Subcommand,
} from "./types.ts";
import { State } from "./state.ts";
import { parse } from "./parse.ts";
import { Arguments } from "./arguments.ts";
import { Meta } from "./meta.ts";
import process from "node:process";
import pc from "picocolors";

process.on("unhandledRejection", (err) => {
  throw err instanceof Error ? err : new Error(String(err));
});

const createAction =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>) =>
  (a: Action<OPTIONS & ARGS>): void => {
    command._action = a;
  };

const createOption =
  <OPTIONS, ARGS, TArgState extends ArgStates>(
    command: Command<OPTIONS, ARGS, TArgState>,
  ) =>
  <USAGE extends `--${string}`>(
    usage: USAGE,
    description: string,
    opts?: CompletionOpt,
  ): Command<OPTIONS & OptionArg<USAGE>, ARGS, TArgState> => {
    const newCommand = command as Command<
      OPTIONS & OptionArg<USAGE>,
      ARGS,
      TArgState
    >;
    const info = Arguments.deriveOptionInfo(usage);
    newCommand.options[Arguments.camelize(info.name) as OptionToName<USAGE>] = {
      usage,
      description,
      ...info,
      ...opts,
    };
    return newCommand;
  };

const createSubcommand =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>): Subcommand<OPTIONS, ARGS> =>
  (name, options, cb): Command<OPTIONS, ARGS, 3> => {
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
    return rest as unknown as Command<OPTIONS, ARGS, 3>;
  };

const createArg =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>) =>
  <USAGE extends `<${string}>`>(
    usage: USAGE,
    description: string,
    opts?: CompletionOpt,
  ): Command<
    OPTIONS,
    ARGS & ArgumentArg<USAGE>,
    USAGE extends `<${string}...>` ? 2 : 1
  > => {
    const { subcommand: _, subcommands: __, ...newCommand } = command;
    const info = Arguments.deriveInfo(usage);
    newCommand.args.push({ usage, description, ...info, ...opts });
    return newCommand as unknown as Command<
      OPTIONS,
      ARGS & ArgumentArg<USAGE>,
      USAGE extends `<${string}...>` ? 2 : 1
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
    options: {},
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
export { pc };
