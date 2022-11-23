import { Command, OptionMeta } from './types';
import { State } from './state';
import minimist from 'minimist';
import { Help } from './help';
import { Utils } from './utils';

const _findSubcommand = (command: Command, subcommandsOrArgs: string[]): [command: Command, args: string[]] => {
  if (!subcommandsOrArgs.length) return [command, subcommandsOrArgs];
  const subcommand = command.subcommands[subcommandsOrArgs[0]];
  if (!subcommand) return [command, subcommandsOrArgs];
  return _findSubcommand(subcommand, subcommandsOrArgs.slice(1));
};

export const findCommand = (commands: string[]): [command: Command, args: string[]] | string => {
  // TODO: What about top-level command? Should we support it?
  if (!commands.length) {
    return 'No command was specified';
  }
  const command = State.commands[commands[0]];
  if (!command) {
    return `Command "${commands[0]}" does not exist`;
  }
  return _findSubcommand(command, commands.slice(1));
};

const _parseArgs = (command: Command, args: string[]): Record<string, string | string[] | undefined> => {
  const errorDetails = `Expected ${command.args} arguments, but was invoked with ${args.length}`;
  let usedArgs = [...args];
  const result = Object.fromEntries(
    command.args.map(({ usage, name }): [string, string | string[]] => {
      const multi = /\.{3}>$/.test(usage);
      if (!usedArgs.length) {
        return Utils.complainAndExit('Too few arguments given: ' + errorDetails);
      } else if (!multi) {
        const arg = usedArgs.shift();
        return [name, arg as string];
      } else {
        const copy = [...usedArgs];
        usedArgs = [];
        return [name, copy];
      }
    })
  );
  if (usedArgs.length) {
    return Utils.complainAndExit('Too many arguments given: ' + errorDetails);
  }
  return result;
};

const _parseOptions = (
  command: Command,
  minimistOptions: Omit<minimist.ParsedArgs, '_'>
): Record<string, string | undefined> => {
  const opts: Record<string, string | undefined> = {};
  Object.entries(command.options as Record<string, OptionMeta>).forEach(([camelName, { name }]) => {
    const value = minimistOptions[name];
    delete minimistOptions[name];
    opts[camelName] = value;
  });
  const remainingArgs = Object.keys(minimistOptions);
  if (remainingArgs.length) {
    Utils.complainAndExit(`Unrecognized options were used: ${remainingArgs.map((name) => '--' + name).join(', ')}`);
  }
  return opts;
};

export const parse = (argv = process.argv): void => {
  const { _: minimistArgs, ...minimistOpts } = minimist(argv.slice(2));
  const wantsHelp = minimistOpts.h || minimistOpts.help;
  if (wantsHelp && !minimistArgs[0]) return Help.show();
  const foundCommand = findCommand(minimistArgs);
  // TODO: Show help message instead?
  if (typeof foundCommand === 'string') return Utils.complainAndExit(foundCommand);
  const [command, args] = foundCommand;
  if (wantsHelp) return Help.show(command);
  const parsedArgs = _parseArgs(command, args);
  const options = _parseOptions(command, minimistOpts);
  const action = command._action;
  if (!action) {
    // TODO: Print full command specifier
    return Utils.complainAndExit(`No action for given command specified`);
  }
  action({ ...options, ...parsedArgs });
};
