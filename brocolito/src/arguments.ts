import { parseArgs, type ParseArgsOptionsConfig } from "node:util";
import type {
  ArgType,
  ArgumentToName,
  Command,
  OptionMeta,
  SnakeToCamelCase,
} from "./types.ts";

const camelize = <S extends string>(str: S): SnakeToCamelCase<S> =>
  str.replace(/(-[a-zA-Z])/g, (w) => w[1].toUpperCase()) as SnakeToCamelCase<S>;

const deriveInfo = <S extends `<${string}${string}>`>(
  usage: S,
): ArgType & { name: ArgumentToName<S> } => {
  const match = usage.match(/^<([a-z0-9-]+)(:.+?)?(\.{3})?>$/i);
  if (!match) {
    throw new Error(
      `Invalid usage specified for arg '${usage}'. Required pattern: <[a-z0-9-]+(\\.{3})?>`,
    );
  }
  const m = match[2]?.substring(1) ?? "string"; // without the collon
  return {
    name: camelize(match[1]) as ArgumentToName<S>,
    type: m === "string" || m === "file" ? m : m.split("|"),
    multi: !!match[3],
  };
};

const deriveOptionInfo = (
  usage: string,
): Pick<OptionMeta, "name" | "type" | "multi" | "mandatory" | "short"> => {
  const match = usage.match(
    /^--(?<name>[a-z0-9-]+)(\|-(?<short>[a-z]))?(?<mandatory>!)?(?: (?<optionType>.+))?$/i,
  );
  if (!match?.groups) {
    throw new Error(
      `Invalid usage specified for option '${usage}'. Required pattern: --[a-z0-9-]+(|-[a-z])?!?( .+)?`,
    );
  }
  const name = match.groups.name;
  const short = match.groups.short;
  const mandatory = !!match.groups.mandatory;
  const optionType = match.groups.optionType;
  // even though mandatory boolean doesn't make sense
  if (!optionType) {
    return { name, short, type: "boolean", mandatory, multi: false };
  }
  const optionTypeMatch = optionType.match(/^<(.+?)(\.{3})?>$/);
  if (!optionTypeMatch) {
    return { name, short, type: "string", mandatory, multi: false };
  }
  const m = optionTypeMatch[1] ?? "string"; // without the collon
  return {
    name,
    short,
    type: m === "string" || m === "file" ? m : m.split("|"),
    mandatory,
    multi: !!optionTypeMatch[2],
  };
};

export type ParseResult = {
  positionals: string[];
  values: Record<string, string | boolean | (string | boolean)[]>;
};

const parse = (
  command: Command<Record<string, unknown>>,
  args: string[],
): ParseResult => {
  const options = Object.values(command.options).reduce<ParseArgsOptionsConfig>(
    (red, meta) => {
      red[meta.name] = {
        type: meta.type === "boolean" ? "boolean" : "string",
        multiple: meta.multi,
      };
      if (meta.short) red[meta.name].short = meta.short;
      return red;
    },
    {},
  );

  // We wrap the core functionality and then process the tokens.
  const { values, positionals } = parseArgs({
    args,
    options,
    tokens: true,
    allowPositionals: true,
    strict: false,
    allowNegative: true,
  });

  return { values: values as ParseResult["values"], positionals };
};

const parseGlobalOptions = (
  args: string[],
): { wantsHelp: boolean; wantsVersion: boolean } => {
  const { values } = parseArgs({
    args,
    options: {
      help: {
        type: "boolean",
        short: "h",
      },
      version: {
        type: "boolean",
        short: "v",
      },
    },
    allowPositionals: true,
    strict: false,
  });

  return { wantsHelp: !!values.help, wantsVersion: !!values.version };
};

export const Arguments = {
  camelize,
  deriveInfo,
  deriveOptionInfo,
  parse,
  parseGlobalOptions,
};
