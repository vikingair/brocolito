export type SnakeToCamelCase<S extends string> = S extends `${infer T}-${infer U}`
  ? `${Lowercase<T>}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

export type OptionToName<S extends string> = S extends `--${infer T} ${string}`
  ? SnakeToCamelCase<T>
  : S extends `--${infer T}`
  ? SnakeToCamelCase<T>
  : never;

type RemoveArgumentBrackets<S extends string> = S extends `<${infer T}>` ? T : never;
type RemoveArgumentFilePrefix<S extends string> = S extends `file:${infer T}` ? T : S;
type RemoveArgumentDots<S extends string> = S extends `${infer T}...` ? T : S;
export type ArgumentToName<S extends string> = SnakeToCamelCase<
  RemoveArgumentFilePrefix<RemoveArgumentDots<RemoveArgumentBrackets<S>>>
>;

export type Action<ARGS> = (args: ARGS) => void | Promise<void>;
export type OptionArg<USAGE extends `--${string}`> = {
  [arg in OptionToName<USAGE>]: (USAGE extends `--${string} ${string}` ? string : boolean) | undefined;
};
type Option<OPTIONS, ARGS> = <USAGE extends `--${string}`>(
  usage: USAGE,
  description: string
) => Command<OPTIONS & OptionArg<USAGE>, ARGS>;
export type OptionMeta = { usage: string; name: string; description: string };
export type Subcommand<OPTIONS, ARGS> = (
  name: string,
  description: string,
  sub: (subcommand: Command<OPTIONS>) => void
) => Command<OPTIONS, ARGS>;
export type ArgumentArg<USAGE extends `<${string}>`> = {
  [arg in ArgumentToName<USAGE>]: USAGE extends `<${string}...>` ? string[] : string | undefined;
};

type Argument<OPTIONS, ARGS> = <USAGE extends `<${string}>`>(
  usage: USAGE,
  description: string
) => Command<OPTIONS, ARGS & ArgumentArg<USAGE>>;

export type Command<OPTIONS = object, ARGS = object> = {
  name: string;
  line: string;
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
