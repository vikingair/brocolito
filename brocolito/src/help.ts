import { State } from "./state.ts";
import { type Command, type OptionMeta } from "./types.ts";
import { Meta } from "./meta.ts";

const _getRow = (
  label: string,
  { description, alias }: { description: string; alias?: string },
  longestLabelLength: number,
): string => {
  const labelPart = `  ${label}${" ".repeat(
    3 + longestLabelLength - label.length,
  )}`;
  const [firstDescLine, ...otherLines] = description.split("\n");
  return `${labelPart}${firstDescLine}${otherLines
    .map((l) => "\n" + " ".repeat(labelPart.length) + l)
    .join()}${alias ? ` (alias: ${alias})` : ""}`;
};

const _getRows = <
  K extends string,
  T extends { description: string; alias?: string } & { [key in K]: string },
>(
  label: string,
  values: T[],
  key: K,
): string => {
  if (!values.length) return "";
  const longestLabelLength = values.reduce(
    (prev, cur) => Math.max(prev, cur[key].length),
    0,
  );
  const rows = values
    .map((v) =>
      _getRow(
        v[key],
        { description: v.description, alias: v.alias },
        longestLabelLength,
      ),
    )
    .join("\n");
  return `\n${label}:\n${rows}\n`;
};

export const _getHelp = (command?: Command): string => {
  if (!command) {
    const commands = Object.values(State.commands);
    const commandRows = _getRows("Commands", commands, "name");
    return `Usage:
  $ ${Meta.name} <command> [options]
${commandRows}`;
  }
  const commands = Object.values(command.subcommands);
  const commandRows = _getRows("Commands", commands, "name");
  const argsRows = _getRows("Args", command.args, "usage");
  const options = Object.values(command.options) as OptionMeta[];
  const optionRows = _getRows("Options", options, "usage");
  const commandLine = `${Meta.name} ${command.line}`;
  const commandHint = commands.length
    ? command._action
      ? "[<command>]"
      : "<command>"
    : undefined;
  const argsHint = command.args.map(({ usage }) => usage).join(" ");
  const optionsHint =
    options.length || commands.length ? "[options]" : undefined;
  const usage = [commandLine, commandHint, argsHint, optionsHint]
    .filter(Boolean)
    .join(" ");

  return `Help:
  ${command.description}

Usage:
  $ ${usage}
${commandRows}${argsRows}${optionRows}`;
};

const show = (command?: Command): void => console.log(_getHelp(command));

export const Help = { show };
