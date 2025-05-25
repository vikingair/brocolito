import { type CompleteItemOrString } from "./completion/tabtab.ts";

export type SnakeToCamelCase<S extends string> =
  S extends `${infer T}-${infer U}`
    ? `${Lowercase<T>}${Capitalize<SnakeToCamelCase<U>>}`
    : S;

type FirstOptionPart<S extends string> = S extends `--${infer T} ${string}`
  ? T
  : S extends `--${infer T}`
    ? T
    : never;

type RemoveMandatoryFlag<S extends string> = S extends `${infer T}!` ? T : S;

export type OptionToName<S extends string> = SnakeToCamelCase<
  RemoveMandatoryFlag<FirstOptionPart<S>>
>;

type RemoveArgumentBrackets<S extends string> = S extends `<${infer T}>`
  ? T
  : never;
type RemoveArgumentType<S extends string> = S extends `${infer T}:${string}`
  ? T
  : S;
type RemoveArgumentDots<S extends string> = S extends `${infer T}...` ? T : S;

type UnionFromPipes<TType extends string> =
  TType extends `${infer TFirst}|${infer TRest}`
    ? TFirst | UnionFromPipes<TRest>
    : TType;

type TypeFromSpec<TSpec extends string> = TSpec extends `${infer T}...`
  ? TypeFromSpec<T>[]
  : TSpec extends "file" | "string"
    ? string
    : UnionFromPipes<TSpec>;

export type ArgumentToName<S extends string> = SnakeToCamelCase<
  RemoveArgumentType<RemoveArgumentDots<RemoveArgumentBrackets<S>>>
>;

export type Action<ARGS> = (args: ARGS) => unknown; // take whatever return value and ignore it anyway
export type OptionArg<USAGE extends `--${string}`> = {
  [arg in OptionToName<USAGE>]: USAGE extends `--${string} ${infer T}`
    ? T extends `<${infer U}>`
      ?
          | TypeFromSpec<U>
          | (USAGE extends `--${string}! <${string}>` ? never : undefined)
      : string | undefined
    : boolean;
};

// ArgStates:
// 0: has no args nor subcommands
// 1: uses args
// 2: uses spread args
// 3: uses subcommands
export type ArgStates = 0 | 1 | 2 | 3;

export type CompletionOpt = {
  completion?: (
    filter: string,
  ) => CompleteItemOrString[] | Promise<CompleteItemOrString[]>;
};

type Option<OPTIONS, ARGS, TArgState extends ArgStates> = <
  USAGE extends `--${string}`,
>(
  usage: USAGE,
  description: string,
  opts?: CompletionOpt,
) => Command<OPTIONS & OptionArg<USAGE>, ARGS, TArgState>;

export type ArgType = {
  type: "string" | "file" | string[];
  multi: boolean;
} & CompletionOpt;

export type OptionMeta = {
  usage: string;
  name: string;
  prefixedName: string;
  description: string;
  type: "boolean" | ArgType["type"];
  multi: ArgType["multi"];
  mandatory: boolean;
} & CompletionOpt;

export type DescriptionOrOpts =
  | string
  | { description: string; alias?: string };

export type Subcommand<OPTIONS, ARGS> = (
  name: string,
  description: DescriptionOrOpts,
  sub: (subcommand: Command<OPTIONS>) => void,
) => Command<OPTIONS, ARGS, 3>;

type TypeOfArg<TUsage extends string> = TUsage extends `<${string}:${infer T}>`
  ? TypeFromSpec<T>
  : TUsage extends `<${string}...>`
    ? string[]
    : string;

export type ArgumentArg<USAGE extends `<${string}>`> = {
  [arg in ArgumentToName<USAGE>]: TypeOfArg<USAGE>;
};

type Argument<OPTIONS, ARGS> = <USAGE extends `<${string}${string}>`>(
  usage: USAGE,
  description: string,
  opts?: CompletionOpt,
) => Command<
  OPTIONS,
  ARGS & ArgumentArg<USAGE>,
  USAGE extends `<${string}...>` ? 2 : 1
>;

type Arguments<OPTIONS, ARGS> = {
  arg: Argument<OPTIONS, ARGS>;
  args: Array<
    {
      name: string;
      usage: `<${string}${string}>`;
      description: string;
    } & ArgType
  >;
};

type Subcommands<OPTIONS, ARGS> = {
  subcommand: Subcommand<OPTIONS, ARGS>;
  subcommands: Record<string, Command<OPTIONS>>;
};

export type Command<
  OPTIONS = Record<PropertyKey, unknown>,
  ARGS = Record<PropertyKey, unknown>,
  TArgState extends ArgStates = 0,
> = {
  name: string;
  line: string;
  description: string;
  action: (action: Action<OPTIONS & ARGS>) => void;
  _action?: Action<OPTIONS & ARGS>;
  option: Option<OPTIONS, ARGS, TArgState>;
  options: Record<keyof OPTIONS, OptionMeta>;
  alias?: string;
} & (TArgState extends 2 | 3
  ? Record<PropertyKey, never>
  : Arguments<OPTIONS, ARGS>) &
  (TArgState extends 1 | 2
    ? Record<PropertyKey, never>
    : Subcommands<OPTIONS, ARGS>);
