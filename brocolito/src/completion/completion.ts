import { showInstallInstruction } from "./install.ts";
import {
  type CompleteItem,
  type CompleteItemOrString,
  Tabtab,
  type TabtabEnv,
} from "./tabtab.ts";
import { State } from "../state.ts";
import { findCommand } from "../parse.ts";
import type { ArgType, CompletionOpt, OptionMeta } from "../types.ts";
import { Meta } from "../meta.ts";
import process from "node:process";

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
  partial,
}: TabtabEnv): Promise<CompleteItemOrString[]> => {
  // top level
  if (partial.prev === Meta.name) {
    return toCompleteItems(State.commands).concat(["--help"]);
  }

  const relevantArgs = partial.parts.slice(1);
  // returns lastArg which wasn't completed yet,
  // could be e.g. used to invoke some custom option resolver with additional information
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lastArg = relevantArgs.pop()!;

  const cmd = findCommand(relevantArgs);

  if ("error" in cmd)
    return cmd.completionSubcommands
      ? toCompleteItems(cmd.completionSubcommands)
      : [];

  const commandArgs = cmd.command.args.slice(cmd.positionals.length); // all arguments that can still be used
  const lastArgInfo = cmd.command.args.at(-1);
  const options = Object.values(cmd.command.options) as OptionMeta[];
  const startedOption = options.find(
    ({ name }) => "--" + name === partial.prev,
  );

  const availableOptionItems = options
    // TODO: repsect already used options from "full.parts"
    .filter(({ name, multi }) => multi || !relevantArgs.includes("--" + name))
    .map(
      ({ name, description }: OptionMeta): CompleteItem => ({
        name: "--" + name,
        description,
      }),
    );

  // debugging autocompletion
  // fs.writeFileSync(
  //   './result.json',
  //   JSON.stringify({ foundCommand, line, prev, optionNames, options }, null, 2)
  // );

  if (startedOption && startedOption.type !== "boolean") {
    return await completeArgType(
      // TS cannot correctly infer that "boolean" case was filtered
      startedOption as { type: ArgType["type"] } & CompletionOpt,
      lastArg,
    );
  } else if (commandArgs.length) {
    return await completeArgType(commandArgs[0], lastArg);
  } else if (lastArgInfo?.multi) {
    return await completeArgType(lastArgInfo, lastArg);
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
