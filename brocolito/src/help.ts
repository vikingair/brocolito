import { State } from './state';
import { Command, OptionMeta } from './types';
import { Meta } from './meta';

const _getRow = (label: string, description: string, longestLabelLength: number): string =>
  `  ${label}${' '.repeat(3 + longestLabelLength - label.length)}${description}`;

const _getRows = <K extends string, T extends { description: string } & { [key in K]: string }>(
  label: string,
  values: T[],
  key: K
): string => {
  if (!values.length) return '';
  const longestLabelLength = values.reduce((prev, cur) => Math.max(prev, cur[key].length), 0);
  const rows = values.map((v) => _getRow(v[key], v.description, longestLabelLength)).join('\n');
  return `\n${label}:\n${rows}\n`;
};

export const _getHelp = (command?: Command): string => {
  if (!command) {
    const commands = Object.values(State.commands);
    const commandRows = _getRows('Commands', commands, 'name');
    return `Usage:
  $ ${Meta.name} <command> [options]
${commandRows}`;
  }
  const commands = Object.values(command.subcommands);
  const commandRows = _getRows('Commands', commands, 'name');
  const options = Object.values(command.options) as OptionMeta[];
  const optionRows = _getRows('Options', options, 'usage');
  const commandLine = `${Meta.name} ${command.line}`;
  const commandHint = commands.length ? (command._action ? '[<command>]' : '<command>') : undefined;
  const optionsHint = options.length || commands.length ? '[options]' : undefined;
  const usage = [commandLine, commandHint, optionsHint].filter(Boolean).join(' ');

  return `Help:
  ${command.description}

Usage:
  $ ${usage}
${commandRows}${optionRows}`;
};

const show = (command?: Command): void => console.log(_getHelp(command));

export const Help = { show };
