[![npm package][npm-image]][npm-url]
[![GitHub Push][push-image]][push-url]

# Brocolito

<img src="./logo.png" alt="brocolito logo" width="105" height="112" />

**Bro**ther **co**mmand **li**ne **to**ol

Create type-safe CLIs to align local development and pipeline workflows.

Powered by [vite](https://www.npmjs.com/package/vite).

## What you get

Ever wanted a type safe, easy to set up CLI that is automatically self-updating locally and can be used
in CI / CD workflows? Brocolito aims to support you with that.

## How to

```sh
pnpm create brocolito-cli@latest
# or
npx create-brocolito-cli@latest
# or
yarn create brocolito-cli@latest
# or
deno run -A npm:create-brocolito-cli@latest
```

Feel free to check out the herein provided [example](.github/cli).

### Minimal code sample

In your `src/main.ts` you create this code:

```ts
import { CLI } from 'brocolito';

CLI.command('hello').action(() => console.log('hello world'));

CLI.parse(); // this needs to be executed after all "commands" were set up
```

Now you can run `cli -h` to see the help message or `cli hello` to print `hello world`.

For more advanced features see below.

### Setup in GitHub Actions

Please check the used custom actions of this repository yourself. It uses [pnpm](.github/actions/pnpm-install)
to install the CLI dependencies and a simple [setup](.github/actions/brocolito-setup) to set up the CLI.

In this [workflow](.github/workflows/pr.yml) you can see it in action.

## CLI features

The CLI contains already many features right away. It was inspired by [commander](https://www.npmjs.com/package/commander)
and [cac](https://www.npmjs.com/package/cac), but it has a slightly different API and some features
that I was found to be missing like native subcommand and tab completion support.

### Help

Using the `-h` or `--help` options on any command, subcommand or top-level will display an
automatically generated help text from your CLI configuration.

### Completion

As soon as you have locally set up the completion, you will get automatically suggestions
based on your CLI configuration. Run `cli completion` to set up the tab completion.

#### Completion for aliases

If you want to use an alias for e.g. one of your subcommands like `cli get data`, you have
to register it to make the completion work like so: `CLI.alias('cgd', 'cli get data')`.

#### Completion for options and args

You can run (async) functions to return the completion results for options and args of type string
or file by passing it as third argument when specifiying the option/arg. E.g.,

```ts
CLI.command("do", "...")
   .option("--service <string>", "name of the service", {
      // "filter" is the string the user has already typed when running the completion
      // ATTENTION: Filtering will work even if you would display all options, but
      //            it can improve performance to reduce the amount of processed data.
      completion: async (filter) => (await getAllServices({ filter })).map(({ name }) => name),
   });
```

### Options

Options are basically named parameters for your command. The specified option names are
accessible under their camelCase name. E.g. `foo-bar` becomes `fooBar`. Values for options can
be specified using a space or `=` as separator, e.g. `--my-option=foo` and `--my-option foo`
are identically treated, whereas `--my-option` without parameters is only valid for option
flags and will be treated as boolean `true`.

#### Boolean Options (Flags)

- Specification: `--option-name`
- Parameter type: `boolean`
- Completion: none
- Code example:

   ```ts
   CLI.command('hello', 'prints hello world')
      .option('--exclamation-mark', 'append exclamation mark')
      .action(({ exclamationMark }) => console.log(`hello world${exclamationMark ? '!' : ''}`));
   ```

- Shell examples:

   ```sh
   cli hello --exclamation-mark
   cli hello --exclamation-mark=false
   cli hello --no-exclamation-mark
   ```

#### String Options

- Specification: `--option-name <string>`
- Parameter type: `string | undefined`
- Completion: none
- Code example:

   ```ts
   CLI.command('hello', 'prints greeting')
      .option('--name <string>', 'who to greet?')
      .action(({ name }) => console.log(name ? `hello ${name}` : "Too shy to give me a name?"));
   ```

- Shell example: `cli hello --name mark`

#### File Options

- Specification: `--option-name <file>`
- Parameter type: `string | undefined`
- Completion: local file system
- Code example:

   ```ts
   CLI.command('char-count', { description: 'count characters', alias: 'cc' })
      .option('--content <file>', 'what file to use?')
      .action(async ({ content }) => console.log((await fs.readFile(content, 'utf-8')).length));
   ```

- Shell example: `cli char-count --content ./foo.txt`

#### Union Options

- Specification: `--option-name <one|two>`
- Parameter type: `"one" | "two" | undefined`
- Completion: `one` or `two`
- Code example:

   ```ts
   CLI.command('fancy-stuff', "do fancy stuff")
      .option('--log-level <debug|info|warn|error>', 'what debug level to use (default: error)')
      .action(({ logLevel = "error" }) => doFancyStuff({ logLevel }));
   ```

- Shell example: `cli fancy-stuff --log-level debug`

#### Multi Options

- Specification: `--option-name <string...>` or `--option-name <one|two...>`
- Parameter type: `string[] | undefined` or `("one" | "two")[] | undefined`
- Completion: like for single options
- Code example:

   ```ts
   CLI.command('char-count', { description: 'count characters', alias: 'cc' })
      .option('--files <file...>', 'what files to use?')
      .action(async ({ files }) => files.forEach((f) => console.log((await fs.readFile(f, 'utf-8')).length)));
   ```

- Shell example: `cli char-count --files ./foo.txt --files ./bar.json`

#### Mandatory Options

- Specification: `--option-name! <string>`
- Parameter type: `string`
- Completion: like the non mandatory options
- Code example:

   ```ts
   CLI.command('hello', 'prints greeting')
      .option('--name! <string>', 'who to greet?')
      .action(({ name }) => console.log(`hello ${name}`));
   ```

- Shell example: `cli hello --name mark`

#### Short Option Aliases

- Specification: `--option-name|-s`
- Parameter type: any of the above
- Completion: like for the full option name
- Code example:

   ```ts
   CLI.command('hello', 'prints hello world')
      .option('--exclamation-mark|-m', 'append exclamation mark')
      .action(({ exclamationMark }) => console.log(`hello world${exclamationMark ? '!' : ''}`));
   ```

- Shell examples:

   ```sh
   cli hello -m
   ```

### Args

Args are basically unnamed parameters or parameter lists. The specified arg names are
accessible under their camelCase name. E.g. `foo-bar` becomes `fooBar`. You can have as
many different args for the same command as you like. You cannot have args **and** subcommands
on a command. If you cannot have another arg after an arg list.

#### String Arg

- Specification: `<arg-name>`
- Parameter type: `string`
- Completion: none
- Code example:

   ```ts
   CLI.command('hello', 'prints greeting')
      .arg('<arg-name>', 'greeting name')
      .action(({ argName }) => console.log(`hello ${name}`));
   ```

- Shell example: `cli hello mark`

#### File Arg

- Specification: `<arg-name:file>`
- Parameter type: `string`
- Completion: local file system
- Code example:

   ```ts
   CLI.command('exists', 'checks existance')
      .arg('<file-name:file>', 'what file to check?')
      .action(({ fileName }) => console.log(fs.existsSync(fileName)));
   ```

- Shell example: `cli exists /tmp/someFile.js`

#### Union Arg

- Specification: `<arg-name:one|two>`
- Parameter type: `"one" | "two"`
- Completion: `one` or `two`
- Code example:

   ```ts
   CLI.command('configure', 'configure settings')
      .arg('<env:dev|test>', 'chosen env')
      .action(configureEnv);
   ```

- Shell example: `cli configure dev`

#### Arg lists

- Specifications: `<arg-name...>` or `<arg-name:file...>`
- Parameter type: `string[]`
- Completions: none or local file system
- Code example:

   ```ts
   CLI.command('exists', 'checks existance')
      .arg('<file-names:file...>', 'what files to check?')
      .action(({ fileNames }) => console.log(fileNames.map((f) => fs.existsSync(f))));
   ```

- Shell example: `cli exists /tmp/someFile.js ./foo.txt`

### Subcommands

Subcommands allow you to create a grouped functionality of commands within other commands.
Subcommands can be as deeply nested as you like. If a command has subcommands it cannot have
args. Options are inherited from the command to all afterwards specified subcommands. Every
subcommand can use further options, args or subcommands as any regular command.

- Code example:

   ```ts
   CLI.command('string', 'do something with strings')
      .option('--error', 'logs as error')
      .subcommand('trim', 'trims a string', (sub) => {
         sub
            .arg('<str>')
            .action(({ str, error }) => console[error ? 'error' : 'log'](str.trim()));
      })
      .subcommand('length', { description: 'counts the chars', alias: 'l' }, (sub) => {
         sub
            .arg('<str>')
            .action(({ str, error }) => console[error ? 'error' : 'log'](str.length));
      })
   ```

- Shell examples:

   ```sh
   cli string trim " foo"
   cli string length "lorem ipsum"
   ```

### Aliases

If you are using aliases for some commands, code completion would stop working correctly, if
you don't register the aliases. E.g. if you have for that command `my-cli foo` an alias
configured in your shell via `alias cf=my-cli foo`, then you need to configure it like this:

```ts
CLI.alias('cf', 'my-cli foo');
```

## Extra features

`brocolito` ships already the following package for your CLI:

- `pc`: Default export of the [picocolors](https://www.npmjs.com/package/picocolors) package to add colors
        to your printed output.

### Recommendations

- `prompts`: Default export of the [prompts](https://www.npmjs.com/package/prompts) package to make use
             of interactive shell prompts. You need to install along with it `@types/prompts`.

## Vite Powered Build

When you build with `brocolito <runtime>` where runtime can be `node`, `deno` or `bun`, then you are opting out
of the Vite powered build, which only happens when running `brocolito` without args and having installed the
optional `vite` dependency. This will bundle all your CLI code in a single JS file.

### External dependencies

If you are using external dependencies, these have to be listed in your `package.json` under
`"dependencies"`. In case of build-in NodeJS dependencies, make sure to use the prefixed package
names, e.g. `node:fs` instead of `fs`. Otherwise, the dependencies might end up included in your
resulting bundle or aren't correctly resolved at all.

[push-image]: https://github.com/vikingair/brocolito/actions/workflows/push.yml/badge.svg
[push-url]: https://github.com/vikingair/brocolito/actions/workflows/push.yml
[npm-image]: https://img.shields.io/npm/v/brocolito.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/brocolito
