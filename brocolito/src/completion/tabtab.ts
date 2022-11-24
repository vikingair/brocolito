// Source: https://github.com/mklabs/tabtab/blob/master/lib/index.js

/**
 * Utility to figure out the shell used on the system.
 *
 * Sadly, we can't use `echo $0` in node, maybe with more work. So we rely on
 * process.env.SHELL.
 *
 */
const systemShell = () => (process.env.SHELL || '').split('/').slice(-1)[0];

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
  // The String input line
  line: string;
  // The String part of line preceding cursor position
  partial: string;
  // The last String word of the line
  last: string;
  // The last word String of partial
  lastPartial: string;
  // The String word preceding last
  prev: string;
};
/**
 * Public: Main utility to extract information from command line arguments and
 * Environment variables, namely COMP args in "plumbing" mode.
 *
 * options -  The options hash as parsed by minimist, plus an env property
 *            representing user environment (default: { env: process.env })
 *    :_      - The arguments Array parsed by minimist (positional arguments)
 *    :env    - The environment Object that holds COMP args (default: process.env)
 *
 * Examples
 *
 *   const env = tabtab.parseEnv();
 *   // env:
 *   // complete    A Boolean indicating whether we act in "plumbing mode" or not
 *   // words       The Number of words in the completed line
 *   // point       A Number indicating cursor position
 *   // line        The String input line
 *   // partial     The String part of line preceding cursor position
 *   // last        The last String word of the line
 *   // lastPartial The last word String of partial
 *   // prev        The String word preceding last
 *
 * Returns the data env object.
 */
const parseEnv = (env: Record<string, string | undefined>): TabtabEnv => {
  if (!env) {
    throw new Error('parseEnv: You must pass in an environment object.');
  }

  let cword = Number(env.COMP_CWORD);
  let point = Number(env.COMP_POINT);
  const line = env.COMP_LINE || '';
  // TODO: Add completion alias support
  const expandedLine = line.replace(/^vg/, 'vlt git');

  if (Number.isNaN(cword)) cword = 0;
  if (Number.isNaN(point)) point = 0;

  const partial = expandedLine.slice(0, point);

  const parts = expandedLine.split(' ');
  const prev = parts.slice(0, -1).slice(-1)[0];

  const last = parts.slice(-1).join('');
  const lastPartial = partial.split(' ').slice(-1).join('');

  let complete = true;
  if (!env.COMP_CWORD || !env.COMP_POINT || !env.COMP_LINE) {
    complete = false;
  }

  return {
    complete,
    words: cword,
    point,
    line: expandedLine,
    partial,
    last,
    lastPartial,
    prev,
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
  if (typeof item !== 'string') return item;
  const shell = systemShell();

  let name = item;
  let description = '';
  const matching = /^(.*?)(\\)?:(.*)$/.exec(item);
  if (matching) {
    [, name, , description] = matching;
  }

  if (shell === 'zsh' && /\\/.test(item)) {
    name += '\\';
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
 *
 */
const log = (args: Array<CompleteItemOrString>) => {
  const shell = systemShell();

  if (!Array.isArray(args)) {
    throw new Error('log: Invalid arguments, must be an array');
  }

  // Normalize arguments if there are some Objects { name, description } in them.
  let normalizedArgs = args.map(completionItem).map((item: CompleteItem) => {
    const { name, description } = item;
    let str = name;
    if (shell === 'zsh' && description) {
      str = `${name.replace(/:/g, '\\:')}:${description}`;
    } else if (shell === 'fish' && description) {
      str = `${name}\t${description}`;
    }

    return str;
  });

  if (shell === 'bash') {
    const env = parseEnv(process.env);
    normalizedArgs = normalizedArgs.filter((arg) => arg.indexOf(env.last) === 0);
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
  console.log('__tabtab_complete_files__');
};

export const Tabtab = { log, parseEnv, logFiles };
