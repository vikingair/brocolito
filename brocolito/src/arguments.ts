import type {
  ArgType,
  ArgumentToName,
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
): Pick<OptionMeta, "name" | "type" | "multi" | "mandatory"> => {
  const match = usage.match(
    /^--(?<name>[a-z0-9-]+)(?<mandatory>!)?(?: (?<optionType>.+))?$/i,
  );
  if (!match?.groups) {
    throw new Error(
      `Invalid usage specified for option '${usage}'. Required pattern: --[a-z0-9-]+( .+)?`,
    );
  }
  const name = match.groups.name;
  const mandatory = !!match.groups.mandatory;
  const optionType = match.groups.optionType;
  // even though mandatory boolean doesn't make sense
  if (!optionType) {
    return { name, type: "boolean", mandatory, multi: false };
  }
  const optionTypeMatch = optionType.match(/^<(.+?)(\.{3})?>$/);
  if (!optionTypeMatch) {
    return { name, type: "string", mandatory, multi: false };
  }
  const m = optionTypeMatch[1] ?? "string"; // without the collon
  return {
    name,
    type: m === "string" || m === "file" ? m : m.split("|"),
    mandatory,
    multi: !!optionTypeMatch[2],
  };
};

export const Arguments = { camelize, deriveInfo, deriveOptionInfo };
