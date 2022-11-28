import minimist from 'minimist';
import { showInstallInstruction } from './install.js';
import { Tabtab, TabtabEnv } from './tabtab.js';
import { State } from '../state';
import { findCommand } from '../parse';
import { OptionMeta } from '../types';
import { Arguments } from '../arguments';

const FileCompletion = ['__files__'];

export const _completion = async ({ prev, line }: TabtabEnv): Promise<string[]> => {
  // top level
  if (prev === State.name) return Object.keys(State.commands).concat(['--help']);

  const lineArgs = line.split(' ');
  const minimistArgs = minimist(lineArgs.slice(1));
  const foundCommand = findCommand(minimistArgs._);

  if (typeof foundCommand === 'string') return [];
  const [command, args] = foundCommand;
  const commandArgs = command.args.slice(args.length); // all arguments that can still be used
  const options = Object.values(command.options) as OptionMeta[];
  const optionNames = options.map(({ prefixedName }) => prefixedName);
  const startedOption = options.find(({ prefixedName }) => prefixedName === prev);

  // debugging autocompletion
  // fs.writeFileSync(
  //   './result.json',
  //   JSON.stringify({ foundCommand, line, prev, optionNames, options }, null, 2)
  // );

  if (startedOption) {
    // TODO: Custom parsers and options
    const { type } = Arguments.deriveOptionInfo(startedOption.usage);
    if (type === 'boolean') return ['true', 'false'];
    if (type === 'file') return FileCompletion;
    return [];
  } else if (commandArgs.length) {
    // FIXME: If subcommands and args are specified, we can complete subcommands before first arg
    //        -> We will allow to have only args XOR subcommands on a command
    // TODO: Custom parsers and options
    const { type } = Arguments.deriveInfo(commandArgs[0].usage);
    if (type === 'file') return FileCompletion;
    return [];
  } else if (prev === command.name) {
    // we autocomplete subcommands only as long as no option was used (even though we support writing options first
    // FIXME: If args were specified, we cannot complete subcommands anymore
    // TODO: Make use of descriptions for completion by using CompletionItems instead of plain strings
    return Object.keys(command.subcommands).concat(optionNames);
  } else {
    return optionNames.filter((o) => !line.includes(o));
  }
};

const completion = async (env: TabtabEnv) => {
  const result = await _completion(env);
  result === FileCompletion ? Tabtab.logFiles() : Tabtab.log(result);
};

const run = async (): Promise<void> => {
  const env = Tabtab.parseEnv(process.env);
  if (env.complete) return completion(env);

  showInstallInstruction();
};

export const Completion = { run };
