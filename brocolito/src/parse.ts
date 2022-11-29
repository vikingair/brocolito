import { Command, OptionMeta } from './types';
import { State } from './state';
import minimist from 'minimist';
import { Help } from './help';
import { Utils } from './utils';
import { Completion } from './completion/completion';
import { Meta } from './meta';

const _findSubcommand = (command: Command, subcommandsOrArgs: string[]): [command: Command, args: string[]] => {
  if (!subcommandsOrArgs.length) return [command, subcommandsOrArgs];
  const subcommand = command.subcommands[subcommandsOrArgs[0]];
  if (!subcommand) return [command, subcommandsOrArgs];
  return _findSubcommand(subcommand, subcommandsOrArgs.slice(1));
};

export const findCommand = (commands: string[]): [command: Command, args: string[]] | string => {
  const command = State.commands[commands[0]];
  if (!command) {
    return `Command "${commands[0]}" does not exist`;
  }
  return _findSubcommand(command, commands.slice(1));
};

const _parseArgs = (command: Command, args: string[]): Record<string, string | string[] | undefined> => {
  const errorDetails = `Expected ${command.args.length} arguments, but was invoked with ${args.length}`;
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
): Record<string, string | boolean | undefined> => {
  const opts: Record<string, string | boolean | undefined> = {};
  Object.entries(command.options as Record<string, OptionMeta>).forEach(([camelName, { name, type, prefixedName }]) => {
    const value = minimistOptions[name];
    delete minimistOptions[name];
    if (typeof value === 'boolean') {
      if (type !== 'boolean') Utils.complainAndExit(`Parameter missing for option --${name}`);
      opts[camelName] = value;
    }
    if (type === 'boolean') {
      if (typeof value === 'string' && value !== 'true' && value !== 'false')
        Utils.complainAndExit(`Invalid value "${value}" provided for flag ${prefixedName}`);
      opts[camelName] = value === true || value === 'true';
    } else {
      opts[camelName] = value;
    }
  });
  const remainingArgs = Object.keys(minimistOptions);
  if (remainingArgs.length) {
    Utils.complainAndExit(`Unrecognized options were used: ${remainingArgs.map((name) => '--' + name).join(', ')}`);
  }
  return opts;
};

export const parse = async (argv = process.argv): Promise<unknown> => {
  const { _: minimistArgs, ...minimistOpts } = minimist(argv.slice(2).filter(Boolean));
  const firstArg = minimistArgs[0];
  if (firstArg === 'completion') return Completion.run();
  const wantsHelp = minimistOpts.h || minimistOpts.help;
  if (!firstArg) {
    if (wantsHelp) return Help.show();
    if (minimistOpts.v || minimistOpts.version) return console.log(Meta.version);
  }
  const foundCommand = findCommand(minimistArgs);
  if (typeof foundCommand === 'string') return Utils.complainAndExit(foundCommand);
  const [command, args] = foundCommand;
  if (wantsHelp) return Help.show(command);
  const parsedArgs = _parseArgs(command, args);
  const options = _parseOptions(command, minimistOpts);
  const action = command._action;
  if (!action) {
    return Utils.complainAndExit(`Configuration error: No action for given command "${command.line}" specified`);
  }
  return action({ ...options, ...parsedArgs });
};
