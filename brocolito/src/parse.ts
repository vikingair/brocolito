import { Command, OptionMeta } from './types';
import { State } from './state';
import minimist from 'minimist';
import { Help } from './help';

const complainAndExit = (errMsg: string): never => {
  throw new Error(errMsg);
};

const _findSubcommand = (command: Command, subcommandsOrArgs: string[]): [command: Command, args: string[]] => {
  if (!subcommandsOrArgs.length) return [command, subcommandsOrArgs];
  const subcommand = command.subcommands[subcommandsOrArgs[0]];
  if (!subcommand) return [command, subcommandsOrArgs];
  return _findSubcommand(subcommand, subcommandsOrArgs.slice(1));
};

const _findCommand = (commands: string[]): [command: Command, args: string[]] => {
  // TODO: What about top-level command? Should we support it?
  if (!commands.length) {
    // TODO: Show help message instead?
    complainAndExit('No command was specified');
  }
  const command = State.commands[commands[0]];
  if (!command) {
    // TODO: Show help message instead?
    complainAndExit(`Command "${commands[0]}" does not exist`);
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
        return complainAndExit('Too few arguments given: ' + errorDetails);
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
    return complainAndExit('Too many arguments given: ' + errorDetails);
  }
  return result;
};

const _parseOptions = (command: Command, args: minimist.ParsedArgs): Record<string, string | undefined> => {
  const { _, ...allArgs } = args;
  const opts: Record<string, string | undefined> = {};
  Object.entries(command.options as Record<string, OptionMeta>).forEach(([camelName, { name }]) => {
    const value = allArgs[name];
    delete allArgs[name];
    opts[camelName] = value;
  });
  const remainingArgs = Object.keys(allArgs);
  if (remainingArgs.length) {
    complainAndExit(`Unrecognized options were used: ${remainingArgs.map((name) => '--' + name).join(', ')}`);
  }
  return opts;
};

export const parse = (argv = process.argv): void => {
  const minimistArgs = minimist(argv.slice(2));
  const wantsHelp = minimistArgs.h || minimistArgs.help;
  if (wantsHelp && !minimistArgs._[0]) return Help.show();
  const [command, args] = _findCommand(minimistArgs._);
  if (wantsHelp) return Help.show(command);
  const parsedArgs = _parseArgs(command, args);
  const options = _parseOptions(command, minimistArgs);
  const action = command._action;
  if (!action) {
    // TODO: Print full command specifier
    return complainAndExit(`No action for given command specified`);
  }
  action({ ...options, ...parsedArgs });
};
