import { State } from './state';
import { Command, OptionMeta } from './types';

export const _getHelp = (command?: Command): string => {
  if (!command) {
    const commands = Object.values(State.commands);
    const longestCommandName = commands.reduce((prev, cur) => Math.max(prev, cur.name.length), 0);
    return `Usage:
  $ ${State.name} <command> [options]

Commands:
${commands
  .map(({ name, description }) => `  ${name}${' '.repeat(3 + longestCommandName - name.length)}${description}`)
  .join('\n')}
`;
  }
  const commands = Object.values(command.subcommands);
  const options = Object.values(command.options) as OptionMeta[];
  const longestCommandName = commands.reduce((prev, cur) => Math.max(prev, cur.name.length), 0);
  const longestOptionUsage = options.reduce((prev, cur) => Math.max(prev, cur.usage.length), 0);
  const commandLine = `${State.name} ${command.line}`;
  const commandHint = commands.length ? (command._action ? '(<command>) ' : '<command> ') : undefined;
  const optionsHint = options.length || commands.length ? '[options]' : undefined;
  const usage = [commandLine, commandHint, optionsHint].filter(Boolean).join(' ');

  // TODO: Display whole line for deeply nested subcommands (need line information on command)
  return `Help:
  ${command.description}

Usage:
  $ ${usage}
${
  commands.length
    ? `
Commands:
${commands
  .map(({ name, description }) => `  ${name}${' '.repeat(3 + longestCommandName - name.length)}${description}`)
  .join('\n')}
`
    : ''
}${
    options.length
      ? `
Options:
${options
  .map(({ usage, description }) => `  ${usage}${' '.repeat(3 + longestOptionUsage - usage.length)}${description}`)
  .join('\n')}
`
      : ''
  }`;
};

const show = (command?: Command): void => console.log(_getHelp(command));

export const Help = { show };
