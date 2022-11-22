import {
  Action,
  ArgumentArg,
  ArgumentToName,
  Command,
  OptionArg,
  OptionToName,
  SnakeToCamelCase,
  Subcommand,
} from './types';
import { State } from './state';
import { parse } from './parse';
import { Utils } from './utils';

const camelize = <S extends string>(str: S): SnakeToCamelCase<S> =>
  str.replace(/(-[a-zA-Z])/g, (w) => w[1].toUpperCase()) as SnakeToCamelCase<S>;

const argumentToName = <S extends string>(str: S): ArgumentToName<S> =>
  camelize(str.replace(/^<(file:)?([a-zA-Z0-9-]+)(\.{3})?>$/, '$2')) as ArgumentToName<S>;

const createAction =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>) =>
  (a: Action<OPTIONS & ARGS>): void => {
    command._action = a;
  };

const createOption =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>) =>
  <USAGE extends `--${string}`>(usage: USAGE, description: string): Command<OPTIONS & OptionArg<USAGE>, ARGS> => {
    const newCommand = command as Command<OPTIONS & OptionArg<USAGE>, ARGS>;
    const [name, arg] = usage.substring(2).split(' ');
    if (!arg) {
      // TODO: add boolean option parser
      // TODO: add parsers in general
      // TODO: Make types in that case more strict and derive from parser
    }
    newCommand.options[camelize(name) as OptionToName<USAGE>] = { usage, name, description };
    return newCommand;
  };

const createSubcommand =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>): Subcommand<OPTIONS, ARGS> =>
  (name, description, cb) => {
    const subcommand = { ...command, name, description } as unknown as Command<OPTIONS>;
    subcommand.line = `${command.line} ${name}`;
    subcommand.args = [];
    subcommand.action = createAction(subcommand);
    subcommand.arg = createArg(subcommand);
    subcommand.option = createOption(subcommand);
    subcommand.options = { ...command.options };
    subcommand.subcommand = createSubcommand(subcommand);
    command.subcommands[name] = subcommand;
    cb(subcommand);
    // return parent command, sub command will be further processed in cb
    return command;
  };

const createArg =
  <OPTIONS, ARGS>(command: Command<OPTIONS, ARGS>) =>
  <USAGE extends `<${string}>`>(usage: USAGE, description: string): Command<OPTIONS, ARGS & ArgumentArg<USAGE>> => {
    const newCommand = command as Command<OPTIONS, ARGS & ArgumentArg<USAGE>>;
    const name = argumentToName(usage);
    newCommand.args.push({ usage, name, description });
    return newCommand;
  };

const command = (name: string, description: string): Command => {
  const command: Command = {
    name,
    line: name,
    description,
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
  };
  command.action = createAction(command);
  command.arg = createArg(command);
  command.option = createOption(command);
  command.subcommand = createSubcommand(command);
  State.commands[name] = command;
  return command;
};

const name = (n: string) => {
  State.name = n;
};

// TODO: Completion
// TODO: Aliases
export const CLI = { command, parse, name, _state: State };

// Utility re-exported (no additional installation required for the peer)
const { pc, complainAndExit } = Utils;
export { pc, complainAndExit };

// CLI.command('git', 'test description')
//   .option('--foo-bar <argument>', 'Please use it')
//   .option('--one', 'You have to')
//   .subcommand('u', 'undo', (u) => {
//     u.option('--another', 'more').action(({ fooBar, one, another }) => {
//       console.log(fooBar, one, another);
//     });
//   })
//   .subcommand('p', 'push', (p) => {
//     p.action(({ fooBar, one }) => {
//       console.log(fooBar, one);
//     });
//   });
