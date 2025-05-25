import { Command, OptionMeta } from "./types.ts";
import { State } from "./state.ts";
import minimist from "minimist";
import { Help } from "./help.ts";
import { Utils } from "./utils.ts";
import { Completion } from "./completion/completion.ts";
import { Meta } from "./meta.ts";
import process from "node:process";

const _findByNameOrAlias = (
  name: string,
  commands: Record<string, Command>,
): Command | undefined => {
  if (name in commands) return commands[name];
  return Object.values(commands).find(({ alias }) => alias === name);
};

type FoundCommand =
  | { command: Command; args: string[]; error?: undefined }
  | { command?: Command; error: string; args: string[] };

const _findSubcommand = (
  command: Command,
  subcommandsOrArgs: string[],
): FoundCommand => {
  if (!subcommandsOrArgs.length) return { command, args: [] };
  const subcommand = _findByNameOrAlias(
    subcommandsOrArgs[0],
    command.subcommands,
  );
  if (!subcommand) {
    if (Object.keys(command.subcommands).length && subcommandsOrArgs.length) {
      return {
        command,
        error: `Unknown subcommand ${Utils.pc.yellow(
          subcommandsOrArgs[0],
        )} specified.`,
        args: subcommandsOrArgs,
      };
    }
    return { command, args: subcommandsOrArgs };
  }
  return _findSubcommand(subcommand, subcommandsOrArgs.slice(1));
};

export const findCommand = (commands: string[]): FoundCommand => {
  const command = _findByNameOrAlias(commands[0], State.commands);
  if (!command) {
    return { error: `Command "${commands[0]}" does not exist`, args: commands };
  }
  return _findSubcommand(command, commands.slice(1));
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
  minimistOptions: Omit<minimist.ParsedArgs, "_">,
): Record<string, string[] | string | boolean | undefined> => {
  const opts: Record<string, string[] | string | boolean | undefined> = {};
  Object.entries(command.options as Record<string, OptionMeta>).forEach(
    ([camelName, { name, type, prefixedName, mandatory, multi }]) => {
      const value = minimistOptions[name];
      delete minimistOptions[name];
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
            `Invalid value "${value}" provided for flag ${prefixedName}`,
          );
        }
        // undefined value also results into false
        opts[camelName] = value === "true";
      } else if (value !== undefined) {
        const checkValiditiy = (v: string) => {
          if (Array.isArray(type) && !type.includes(v)) {
            throw new Error(
              `Invalid value "${v}" provided for flag ${prefixedName}. Must be one of: ${type.join(
                " | ",
              )}`,
            );
          }
        };
        if (Array.isArray(value)) {
          if (multi) {
            value.forEach(checkValiditiy);
            opts[camelName] = value;
          } else {
            throw new Error(
              `Invalidly multiple values [${value
                .map((v) => `"${v}"`)
                .join(", ")}] were provided for flag ${prefixedName}`,
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
  const remainingArgs = Object.keys(minimistOptions);
  if (remainingArgs.length) {
    throw new Error(
      `Unrecognized options were used: ${remainingArgs
        .map((name) => "--" + name)
        .join(", ")}`,
    );
  }
  return opts;
};

export const parse = async (argv = process.argv): Promise<unknown> => {
  const { _: minimistArgs, ...minimistOpts } = minimist(
    argv.slice(2).filter(Boolean),
  );
  const firstArg = minimistArgs[0];
  if (firstArg === "completion") return Completion.run();
  if (!firstArg) {
    if (minimistOpts.v || minimistOpts.version) {
      return console.log(Meta.version);
    }
    return Help.show();
  }
  const wantsHelp = minimistOpts.h || minimistOpts.help;
  const { command, args, error } = findCommand(minimistArgs);
  if (wantsHelp) return Help.show(command);
  if (typeof error === "string") {
    if (command) Help.show(command);
    throw new Error(error);
  }
  const parsedArgs = _parseArgs(command, args);
  const options = _parseOptions(command, minimistOpts);
  const action = command._action;
  if (!action) {
    throw new Error(
      `Configuration error: No action for given command "${command.line}" specified`,
    );
  }
  return await action({ ...options, ...parsedArgs });
};
