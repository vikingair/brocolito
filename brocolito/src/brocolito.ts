import minimist from 'minimist';

type SnakeToCamelCase<S extends string> = S extends `${infer T}-${infer U}`
  ? `${Lowercase<T>}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type OptionToName<S extends string> = S extends `--${infer T} ${string}`
  ? SnakeToCamelCase<T>
  : S extends `--${infer T}`
  ? SnakeToCamelCase<T>
  : never;

type RemoveArgumentBrackets<S extends string> = S extends `<${infer T}>` ? T : never;
type RemoveArgumentFilePrefix<S extends string> = S extends `file:${infer T}` ? T : S;
type RemoveArgumentDots<S extends string> = S extends `${infer T}...` ? T : S;
type ArgumentToName<S extends string> = SnakeToCamelCase<
  RemoveArgumentFilePrefix<RemoveArgumentDots<RemoveArgumentBrackets<S>>>
>;

const complainAndExit = (errMsg: string): never => {
  throw new Error(errMsg);
};

const camelize = <S extends string>(str: S): SnakeToCamelCase<S> =>
  str.replace(/(-[a-zA-Z])/g, (w) => w[1].toUpperCase()) as SnakeToCamelCase<S>;

const argumentToName = <S extends string>(str: S): ArgumentToName<S> =>
  camelize(str.replace(/^<(file:)?([a-zA-Z0-9-]+)(\.{3})?>$/, '$2')) as ArgumentToName<S>;

type Action<ARGS> = (args: ARGS) => void | Promise<void>;
type OptionArg<USAGE extends `--${string}`> = {
  [arg in OptionToName<USAGE>]: (USAGE extends `--${string} ${string}` ? string : boolean) | undefined;
};
type Option<OPTIONS, ARGS> = <USAGE extends `--${string}`>(
  usage: USAGE,
  description: string
) => Command<OPTIONS & OptionArg<USAGE>, ARGS>;
type OptionMeta = { usage: string; name: string; description: string };
type Subcommand<OPTIONS, ARGS> = (
  name: string,
  description: string,
  sub: (subcommand: Command<OPTIONS>) => void
) => Command<OPTIONS, ARGS>;
type ArgumentArg<USAGE extends `<${string}>`> = {
  [arg in ArgumentToName<USAGE>]: USAGE extends `<${string}...>` ? string[] : string | undefined;
};

type Argument<OPTIONS, ARGS> = <USAGE extends `<${string}>`>(
  usage: USAGE,
  description: string
) => Command<OPTIONS, ARGS & ArgumentArg<USAGE>>;

type Command<OPTIONS = object, ARGS = object> = {
  name: string;
  description: string;
  action: (action: Action<OPTIONS & ARGS>) => void;
  _action?: Action<OPTIONS & ARGS>;
  arg: Argument<OPTIONS, ARGS>;
  args: { name: string; usage: string; description: string }[];
  option: Option<OPTIONS, ARGS>;
  options: Record<keyof OPTIONS, OptionMeta>;
  subcommand: Subcommand<OPTIONS, ARGS>;
  subcommands: Record<string, Command<OPTIONS>>;
};

const commands: Record<string, Command> = {};

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
  const command = CLI.commands[commands[0]];
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

const parse = (argv = process.argv): void => {
  const minimistArgs = minimist(argv.slice(2));
  const [command, args] = _findCommand(minimistArgs._);
  const parsedArgs = _parseArgs(command, args);
  const options = _parseOptions(command, minimistArgs);
  const action = command._action;
  console.log({ minimistArgs, options });
  if (!action) {
    // TODO: Print full command specifier
    return complainAndExit(`No action for given command specified`);
  }
  action({ ...options, ...parsedArgs });
};

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
  CLI.commands[name] = command;
  return command;
};

// TODO: Completion
// TODO: Help message
// TODO: Aliases
export const CLI = { command, parse, commands };

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
