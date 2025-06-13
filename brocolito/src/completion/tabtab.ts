// Source: https://github.com/mklabs/tabtab/blob/master/lib/index.js

import { Meta } from "../meta.ts";
import process from "node:process";

/**
 * Utility to figure out the shell used on the system.
 *
 * Sadly, we can't use `echo $0` in node, maybe with more work. So we rely on
 * process.env.SHELL.
 */
export const systemShell = () => (process.env.SHELL || "").split("/").at(-1);

/**
 * Tabtab environment data that return from "parseEnv" method
 */
export type TabtabEnv = {
  // A Boolean indicating whether we act in "plumbing mode" or not
  complete: boolean;
  // The Number of words in the completed line
  words: number;
  // A Number indicating cursor position
  point: number;
  full: {
    line: string;
    // The last String word of the line
    last: string;
    // The String word preceding last
    prev: string;
    // the args as array
    parts: string[];
  };
  // considers only the line up until the current cursor position
  partial: {
    line: string;
    // The last String word of the line
    last: string;
    // The String word preceding last
    prev: string;
    // the args as array
    parts: string[];
  };
};

/**
 * Public: Main utility to extract information from command line arguments and
 * Environment variables, namely COMP args in "plumbing" mode.
 */
const parseEnv = (env: Record<string, string | undefined>): TabtabEnv => {
  let cword = Number(env.COMP_CWORD);
  let point = Number(env.COMP_POINT);
  const line = env.COMP_LINE || "";
  const firstArg = line.split(" ")[0];
  const alias = Meta.aliases?.[firstArg];
  if (firstArg && !alias && firstArg !== Meta.name) {
    throw new Error(`Completion invoked with not configured alias ${firstArg}.
Use e.g. -> CLI.alias('${firstArg}', '${Meta.name} my-subcommand')
`);
  }
  const expandedLine = alias
    ? line.replace(new RegExp(`^${firstArg}`), alias)
    : line;

  if (Number.isNaN(cword)) cword = 0;
  if (Number.isNaN(point)) point = 0;

  if (alias) point += alias.length - firstArg.length;

  const parts = expandedLine.split(" ");
  const prev = parts.slice(0, -1).slice(-1)[0];
  const last = parts.slice(-1).join("");

  const partial = expandedLine.slice(0, point);
  const partialParts = partial.split(" ");
  const prevPartial = partialParts.slice(0, -1).slice(-1)[0];
  const lastPartial = partialParts.slice(-1).join("");

  let complete = true;
  if (!env.COMP_CWORD || !env.COMP_POINT || !env.COMP_LINE) {
    complete = false;
  }

  return {
    complete,
    words: cword,
    point,
    full: {
      line: expandedLine,
      last,
      prev,
      parts,
    },
    partial: {
      line: partial,
      last: lastPartial,
      prev: prevPartial,
      parts: partialParts,
    },
  };
};

/**
 * this is an item to show when completion enable
 */
export type CompleteItem = {
  name: string;
  description?: string;
};

export type CompleteItemOrString = string | CompleteItem;

/**
 * Helper to normalize String and Objects with { name, description } when logging out.
 */
const completionItem = (item: CompleteItemOrString): CompleteItem => {
  if (typeof item !== "string") return item;
  const shell = systemShell();

  let name = item;
  let description = "";
  const matching = /^(.*?)(\\)?:(.*)$/.exec(item);
  if (matching) {
    [, name, , description] = matching;
  }

  if (shell === "zsh" && /\\/.test(item)) {
    name += "\\";
  }

  return {
    name,
    description,
  };
};

/**
 * Main logging utility to pass completion items.
 *
 * This is simply a helper to log to stdout with each item separated by a new
 * line.
 *
 * Bash needs in addition to filter out the args for the completion to work
 * (zsh, fish don't need this).
 */
const log = (args: Array<CompleteItemOrString>) => {
  const shell = systemShell();

  if (!Array.isArray(args)) {
    throw new Error("log: Invalid arguments, must be an array");
  }

  // Normalize arguments if there are some Objects { name, description } in them.
  let normalizedArgs = args.map(completionItem).map((item: CompleteItem) => {
    const { name, description } = item;
    let str = name;
    if (shell === "zsh" && description) {
      str = `${name.replace(/:/g, "\\:")}:${description}`;
    } else if (shell === "fish" && description) {
      str = `${name}\t${description}`;
    }

    return str;
  });

  if (shell === "bash") {
    const env = parseEnv(process.env);
    normalizedArgs = normalizedArgs.filter(
      (arg) => arg.indexOf(env.full.last) === 0,
    );
  }

  for (const arg of normalizedArgs) {
    console.log(`${arg}`);
  }
};

/**
 * Copied from: https://github.com/pnpm/tabtab
 * Logging utility to trigger the filesystem autocomplete.
 *
 * This function just returns a constant string that is then interpreted by the
 * completion scripts as an instruction to trigger the built-in filesystem
 * completion.
 */
const logFiles = () => {
  console.log("__tabtab_complete_files__");
};

export const Tabtab = { log, parseEnv, logFiles };
