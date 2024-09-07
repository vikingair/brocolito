import type {
  ArgType,
  ArgumentToName,
  OptionMeta,
  SnakeToCamelCase,
} from "./types";
import { Utils } from "./utils";

const camelize = <S extends string>(str: S): SnakeToCamelCase<S> =>
  str.replace(/(-[a-zA-Z])/g, (w) => w[1].toUpperCase()) as SnakeToCamelCase<S>;

const deriveInfo = <S extends string>(
  usage: S,
): ArgType & { name: ArgumentToName<S> } => {
  const match = usage.match(/^<([a-zA-Z0-9-]+)(:.+?)?(\.{3})?>$/);
  if (!match)
    return Utils.complainAndExit(
      'Invalid usage specified for arg "usage". Param name needs to consist of these character only [a-z0-9-]',
    );
  const m = match[2]?.substring(1) ?? "string"; // without the collon
  return {
    name: match[1] as ArgumentToName<S>,
    type: m === "string" || m === "file" ? m : m.split("|"),
    multi: !!match[3],
  };
};

const deriveOptionInfo = (
  usage: string,
): Pick<
  OptionMeta,
  "name" | "type" | "prefixedName" | "multi" | "mandatory"
> => {
  const [_prefixedName, arg] = usage.split(" ");
  const mandatory = _prefixedName.endsWith("!");
  const prefixedName = mandatory ? _prefixedName.slice(0, -1) : _prefixedName;
  const name = prefixedName.substring(2);
  // even though mandatory boolean doesn't make sense
  if (!arg)
    return { name, prefixedName, type: "boolean", mandatory, multi: false };
  const match = arg && arg.match(/^<(.+?)(\.{3})?>$/);
  if (!match)
    return { name, prefixedName, type: "string", mandatory, multi: false };
  const m = match[1] ?? "string"; // without the collon
  return {
    name,
    prefixedName,
    type: m === "string" || m === "file" ? m : m.split("|"),
    mandatory,
    multi: !!match[2],
  };
};

export const Arguments = { camelize, deriveInfo, deriveOptionInfo };
