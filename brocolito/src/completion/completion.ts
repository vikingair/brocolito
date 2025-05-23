import minimist from "minimist";
import { showInstallInstruction } from "./install.js";
import {
  type CompleteItem,
  type CompleteItemOrString,
  Tabtab,
  type TabtabEnv,
} from "./tabtab.js";
import { State } from "../state";
import { findCommand } from "../parse";
import type { OptionMeta, ArgType, CompletionOpt } from "../types";
import { Meta } from "../meta";

const FileCompletion = ["__files__"];

const toCompleteItems = (
  commands: Record<string, { description: string }>,
): CompleteItemOrString[] =>
  Object.entries(commands).map(([key, { description }]) => ({
    name: key,
    description,
  }));

const completeArgType = async (
  {
    type,
    completion,
  }: {
    type: ArgType["type"];
  } & CompletionOpt,
  lastArg: string,
): Promise<CompleteItemOrString[]> => {
  // TODO: Add existing matched options and args to possibly derive faster/better autocompletion results
  //       from the custom completion.
  const customCompletion = await completion?.(lastArg);
  if (customCompletion?.length) return customCompletion;
  if (type === "file") return FileCompletion;
  if (Array.isArray(type)) return type;
  return [];
};

export const _completion = async ({
  prev,
  line,
}: TabtabEnv): Promise<CompleteItemOrString[]> => {
  // top level
  if (prev === Meta.name)
    return toCompleteItems(State.commands).concat(["--help"]);

  const lineArgs = line.split(" ");
  // returns lastArg which wasn't completed yet,
  // could be e.g. used to invoke some custom option resolver with additional information
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lastArg = lineArgs.pop()!;
  const minimistArgs = minimist(lineArgs.slice(1));
  const { command, args } = findCommand(minimistArgs._);

  if (!command) return [];

  const commandArgs = command.args.slice(args.length); // all arguments that can still be used
  const lastArgInfo = command.args.at(-1);
  const options = Object.values(command.options) as OptionMeta[];
  const startedOption = options.find(
    ({ prefixedName }) => prefixedName === prev,
  );

  const availableOptionItems = options
    .filter(
      ({ prefixedName, multi }) => multi || !lineArgs.includes(prefixedName),
    )
    .map(
      ({ prefixedName, description }: OptionMeta): CompleteItem => ({
        name: prefixedName,
        description,
      }),
    );

  // debugging autocompletion
  // fs.writeFileSync(
  //   './result.json',
  //   JSON.stringify({ foundCommand, line, prev, optionNames, options }, null, 2)
  // );

  if (startedOption && startedOption.type !== "boolean") {
    return completeArgType(
      // TS cannot correctly infer that "boolean" case was filtered
      startedOption as { type: ArgType["type"] } & CompletionOpt,
      lastArg,
    );
  } else if (commandArgs.length) {
    return completeArgType(commandArgs[0], lastArg);
  } else if (lastArgInfo?.multi) {
    return completeArgType(lastArgInfo, lastArg);
  } else if (prev === command.name || prev === command.alias) {
    // we autocomplete subcommands only as long as no option was used (even though we support writing options first)
    return toCompleteItems(command.subcommands).concat(availableOptionItems);
  } else {
    return availableOptionItems;
  }
};

const completion = async (env: TabtabEnv) => {
  const result = await _completion(env);
  return result === FileCompletion ? Tabtab.logFiles() : Tabtab.log(result);
};

const run = async (): Promise<void> => {
  const env = Tabtab.parseEnv(process.env);
  if (env.complete) return completion(env);

  await showInstallInstruction();
};

export const Completion = { run };
