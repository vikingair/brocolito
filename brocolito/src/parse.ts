import type { Command, OptionMeta } from "./types.ts";
import { State } from "./state.ts";
import { Help } from "./help.ts";
import { Utils } from "./utils.ts";
import { Completion } from "./completion/completion.ts";
import { Meta } from "./meta.ts";
import process from "node:process";
import { Arguments, type ParseResult } from "./arguments.ts";

const _findByNameOrAlias = (
  name: string,
  commands: Record<string, Command>,
): Command | undefined => {
  if (name in commands) return commands[name];
  return Object.values(commands).find(({ alias }) => alias === name);
};

type FoundSubcommand = {
  command: Command;
} & (
  | {
      depth: number;
    }
  | {
      error: string;
      completionSubcommands?: Record<string, { description: string }>;
    }
);

const _findSubcommand = (
  command: Command,
  positionals: string[],
  depth: number,
): FoundSubcommand => {
  if (!Object.keys(command.subcommands).length) {
    return { command, depth };
  }

  if (!positionals.length) {
    return {
      command,
      error: "Specify a subcommand to be used.",
      completionSubcommands: command.subcommands,
      depth,
    };
  }

  const subcommand = positionals.length
    ? _findByNameOrAlias(positionals[0], command.subcommands)
    : undefined;

  if (!subcommand) {
    return {
      command,
      error: `Unknown subcommand ${Utils.pc.yellow(positionals[0])} specified.`,
      depth,
    };
  }
  return _findSubcommand(subcommand, positionals.slice(1), depth + 1);
};

type FoundCommand =
  | ({
      command: Command;
    } & ParseResult)
  | {
      command?: Command;
      error: string;
      completionSubcommands?: Record<string, { description: string }>;
    };

export const findCommand = (args: string[]): FoundCommand => {
  const firstNonPositionalIndex = args.findIndex((arg) => arg.startsWith("-"));
  const commandPositionals =
    firstNonPositionalIndex >= 0
      ? args.slice(0, firstNonPositionalIndex)
      : args;

  const command = _findByNameOrAlias(commandPositionals[0], State.commands);
  if (!command) {
    return { error: `Command "${commandPositionals[0]}" does not exist` };
  }
  const cmd = _findSubcommand(command, commandPositionals.slice(1), 1);
  if ("error" in cmd) return cmd;

  const { values, positionals } = Arguments.parse(
    cmd.command,
    args.slice(cmd.depth),
  );

  console.log({ values });

  return { ...cmd, values, positionals };
};

const _parseArgs = (
  command: Command,
  args: string[],
): Record<string, string | string[] | undefined> => {
  const throwError = (reason: string, remainingArgs?: string[]) => {
    Help.show(command);
    throw new Error(
      `${reason}: Expected ${command.args.length} arguments, but was invoked with ${args.length}.${
        remainingArgs
          ? `
The following arguments could not be processed: ${Utils.pc.yellow(
              remainingArgs.join(" "),
            )}`
          : ""
      }`,
    );
  };

  let usedArgs = [...args];
  const result = Object.fromEntries(
    command.args.map(
      ({ usage, name, type, multi }): [string, string | string[]] => {
        const checkValiditiy = (v: string) => {
          if (Array.isArray(type) && !type.includes(v)) {
            throw new Error(`Invalid value "${v}" provided for arg ${usage}.`);
          }
        };
        if (!usedArgs.length) {
          return throwError("Too few arguments given");
        } else if (!multi) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const arg = usedArgs.shift()!;
          checkValiditiy(arg);
          return [name, arg];
        } else {
          const copy = [...usedArgs];
          copy.forEach(checkValiditiy);
          usedArgs = [];
          return [name, copy];
        }
      },
    ),
  );
  if (usedArgs.length) return throwError("Too many arguments given", usedArgs);
  return result;
};

const _parseOptions = (
  command: Command,
  options: ParseResult["values"],
): Record<string, string[] | string | boolean | undefined> => {
  const opts: Record<string, string[] | string | boolean | undefined> = {};
  Object.entries(command.options as Record<string, OptionMeta>).forEach(
    ([camelName, { name, type, mandatory, multi }]) => {
      const value = options[name];
      delete options[name];
      if (mandatory && value === undefined) {
        throw new Error(`Mandatory options was not provided: --${name}`);
      }

      if (typeof value === "boolean") {
        if (type !== "boolean") {
          throw new Error(`Parameter missing for option --${name}`);
        }
        opts[camelName] = value;
      } else if (type === "boolean") {
        if (
          typeof value === "string" &&
          value !== "true" &&
          value !== "false"
        ) {
          throw new Error(
            `Invalid value "${value}" provided for flag --${name}`,
          );
        }
        // undefined value also results into false
        opts[camelName] = value === "true";
      } else if (value !== undefined) {
        const checkValiditiy = (v: string | boolean) => {
          if (typeof v === "boolean") {
            throw new Error(
              `Invalid boolean in list of values provided for flag --${name}`,
            );
          }
          if (Array.isArray(type) && !type.includes(v)) {
            throw new Error(
              `Invalid value "${v}" provided for flag --${name}. Must be one of: ${type.join(
                " | ",
              )}`,
            );
          }
        };
        if (Array.isArray(value)) {
          if (multi) {
            value.forEach(checkValiditiy);
            opts[camelName] = value as string[];
          } else {
            throw new Error(
              `Invalidly multiple values [${value
                .map((v) => `"${v}"`)
                .join(", ")}] were provided for flag --${name}`,
            );
          }
        } else {
          checkValiditiy(value);
          if (multi) {
            opts[camelName] = [value];
          } else {
            opts[camelName] = value;
          }
        }
      }
    },
  );
  const remainingArgs = Object.keys(options);
  if (remainingArgs.length) {
    throw new Error(
      `Unrecognized options were used: ${remainingArgs
        .map((name) => "--" + name)
        .join(", ")}`,
    );
  }
  return opts;
};

// export const getCommandPositionals;

export const parse = async (argv = process.argv): Promise<unknown> => {
  const relevantArgs = argv.slice(2);

  const { wantsHelp, wantsVersion } =
    Arguments.parseGlobalOptions(relevantArgs);

  const firstArg = relevantArgs[0];
  if (firstArg === "completion") return Completion.run();
  if (!firstArg || firstArg[0] === "-") {
    if (wantsVersion) {
      return console.log(Meta.version);
    }
    return Help.show();
  }
  const cmd = findCommand(relevantArgs);
  if (wantsHelp) return Help.show(cmd.command);
  if ("error" in cmd) {
    if (cmd.command) Help.show(cmd.command);
    throw new Error(cmd.error);
  }
  // first parsing options, because using unknown options can leave us with unknown positionals as a side effect
  const options = _parseOptions(cmd.command, cmd.values);
  const parsedArgs = _parseArgs(cmd.command, cmd.positionals);
  const action = cmd.command._action;
  if (!action) {
    throw new Error(
      `Configuration error: No action for given command "${cmd.command.line}" specified`,
    );
  }
  return await action({ ...options, ...parsedArgs });
};
