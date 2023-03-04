import minimist from 'minimist';
import { showInstallInstruction } from './install.js';
import { CompleteItemOrString, Tabtab, TabtabEnv } from './tabtab.js';
import { State } from '../state';
import { findCommand } from '../parse';
import { OptionMeta } from '../types';
import { Arguments } from '../arguments';
import { Meta } from '../meta';

const FileCompletion = ['__files__'];

const toCompleteItems = (commands: Record<string, { description: string }>): CompleteItemOrString[] =>
  Object.entries(commands).map(([key, { description }]) => ({ name: key, description }));

export const _completion = async ({ prev, line }: TabtabEnv): Promise<CompleteItemOrString[]> => {
  // top level
  if (prev === Meta.name) return toCompleteItems(State.commands).concat(['--help']);

  const lineArgs = line.split(' ');
  const minimistArgs = minimist(lineArgs.slice(1));
  const foundCommand = findCommand(minimistArgs._);

  if (typeof foundCommand === 'string') return [];
  const [command, args] = foundCommand;
  const commandArgs = command.args.slice(args.length); // all arguments that can still be used
  const options = Object.values(command.options) as OptionMeta[];
  const optionItems = options.map(({ prefixedName, description }) => ({ name: prefixedName, description }));
  const startedOption = options.find(({ prefixedName }) => prefixedName === prev);
  const startedOptionType = startedOption ? Arguments.deriveOptionInfo(startedOption.usage).type : undefined;

  // debugging autocompletion
  // fs.writeFileSync(
  //   './result.json',
  //   JSON.stringify({ foundCommand, line, prev, optionNames, options }, null, 2)
  // );

  if (startedOptionType && startedOptionType !== 'boolean') {
    // TODO: Custom parsers and options
    if (startedOptionType === 'file') return FileCompletion;
    return [];
  } else if (commandArgs.length) {
    // TODO: Custom parsers and options
    const { type } = Arguments.deriveInfo(commandArgs[0].usage);
    if (type === 'file') return FileCompletion;
    return [];
  } else if (prev === command.name || prev === command.alias) {
    // we autocomplete subcommands only as long as no option was used (even though we support writing options first)
    return toCompleteItems(command.subcommands).concat(optionItems);
  } else {
    return optionItems.filter(({ name }) => !line.includes(name));
  }
};

const completion = async (env: TabtabEnv) => {
  const result = await _completion(env);
  result === FileCompletion ? Tabtab.logFiles() : Tabtab.log(result);
};

const run = async (): Promise<void> => {
  const env = Tabtab.parseEnv(process.env);
  if (env.complete) return completion(env);

  await showInstallInstruction();
};

export const Completion = { run };
