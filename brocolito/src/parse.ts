import { Command, OptionMeta } from "./types";
import { State } from "./state";
import minimist from "minimist";
import { Help } from "./help";
import { Utils } from "./utils";
import { Completion } from "./completion/completion";
import { Meta } from "./meta";

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
    return Utils.complainAndExit(
      `${reason}: Expected ${
        command.args.length
      } arguments, but was invoked with ${args.length}.${
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
    command.args.map(({ usage, name }): [string, string | string[]] => {
      const multi = /\.{3}>$/.test(usage);
      if (!usedArgs.length) {
        return throwError("Too few arguments given");
      } else if (!multi) {
        const arg = usedArgs.shift();
        return [name, arg as string];
      } else {
        const copy = [...usedArgs];
        usedArgs = [];
        return [name, copy];
      }
    }),
  );
  if (usedArgs.length) return throwError("Too many arguments given", usedArgs);
  return result;
};

const _parseOptions = (
  command: Command,
  minimistOptions: Omit<minimist.ParsedArgs, "_">,
): Record<string, string | boolean | undefined> => {
  const opts: Record<string, string | boolean | undefined> = {};
  Object.entries(command.options as Record<string, OptionMeta>).forEach(
    ([camelName, { name, type, prefixedName }]) => {
      const value = minimistOptions[name];
      delete minimistOptions[name];
      if (typeof value === "boolean") {
        if (type !== "boolean")
          Utils.complainAndExit(`Parameter missing for option --${name}`);
        opts[camelName] = value;
      }
      if (type === "boolean") {
        if (typeof value === "string" && value !== "true" && value !== "false")
          Utils.complainAndExit(
            `Invalid value "${value}" provided for flag ${prefixedName}`,
          );
        opts[camelName] = value === true || value === "true";
      } else {
        if (Array.isArray(value))
          Utils.complainAndExit(
            `Invalidly multiple values "${value}" were provided for flag ${prefixedName}`,
          );
        opts[camelName] = value;
      }
    },
  );
  const remainingArgs = Object.keys(minimistOptions);
  if (remainingArgs.length) {
    Utils.complainAndExit(
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
  const wantsHelp = minimistOpts.h || minimistOpts.help;
  if (!firstArg) {
    if (wantsHelp) return Help.show();
    if (minimistOpts.v || minimistOpts.version)
      return console.log(Meta.version);
  }
  const { command, args, error } = findCommand(minimistArgs);
  if (wantsHelp) return Help.show(command);
  if (typeof error === "string") {
    if (command) Help.show(command);
    return Utils.complainAndExit(error);
  }
  const parsedArgs = _parseArgs(command, args);
  const options = _parseOptions(command, minimistOpts);
  const action = command._action;
  if (!action) {
    return Utils.complainAndExit(
      `Configuration error: No action for given command "${command.line}" specified`,
    );
  }
  return action({ ...options, ...parsedArgs });
};
