[![npm package][npm-image]][npm-url]
[![GitHub Push][push-image]][push-url]

# Brocolito

<img src="./logo.png" alt="brocolito logo" width="105" height="112" />

**Bro**ther **co**mannd **li**ne **to**ol

Create type-safe CLIs to align local development and pipeline workflows.

Powered by [vite](https://www.npmjs.com/package/vite).

## What you get

Ever wanted a type safe, easy to set up CLI that is automatically self-updating locally and can be used
in CI / CD workflows? Brocolito aims to support you with that.

## How to

You create some directory for your CLI code and place two mandatory files in it:

- `package.json`
  - the `name` will be the name of your CLI, e.g. `cli`.
  - the `dependencies` should contain `brocolito`
    - you can install it e.g. via `pnpm install brocolito`
  - the `scripts` should contain e.g. `"build": "brocolito build"`
- the `src/main.ts` is your index file for the CLI code
  - below you can find a minimal code sample

Run the build script to set up the CLI, from the above example with `pnpm build`.
You will get printed how to make the CLI globally available for you.

Additional recommendations:

- Install `devDependencies`: `typescript` and `@types/node`
- Add `tsconfig.json`
- Add `lint` script for your CLI

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

### Future plans

- Create an initial setup using `create-brocolito-cli` package
  - Then you can set the above up using `pnpm create brocolito-cli`
- Include some more examples of interesting CLI relevant features that can be adopted

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

#### Aliases

If you want to use an alias for e.g. one of your subcommands like `cli get data`, you have
to register it to make the completion work like so: `CLI.alias('cgd', 'cli get data')`.

### Options

Options are basically named parameters for your command. The specified option names are
accessible under their camelCase name. E.g. `foo-bar` becomes `fooBar`. Values for options can
be specified using a space or `=` as separator, e.g. `--my-option=foo` and `--my-option foo`
are identically treated, whereas `--my-option` without parameters is only valid for option
flags and will be treated as boolean `true`.

#### Boolean Options (Flags)

- Specification: `--option-name`
- Parameter type: `boolean`
- Completion: `true` or `false`
- Code example:
```ts
CLI.command('hello', 'prints hello world')
   .option('--with-exclamation-mark', 'append exclamation mark')
   .action(({ withExclamationMark }) => console.log(`hello world${withExclamationMark ? '!' : ''}`));
```
- Shell examples:
```
cli hello --with-exclamation-mark
cli hello --with-exclamation-mark=true
cli hello --with-exclamation-mark false
```

#### String Options

- Specification: `--option-name <string>`
- Parameter type: `string | undefined`
- Completion: none
- Code example:
```ts
CLI.command('hello', 'prints greeting')
   .option('--name <string>', 'who to greet?')
   .action(({ name }) => console.log(`hello ${name}`));
```
- Shell example: `cli hello --name mark`

#### File Options

- Specification: `--option-name <file>`
- Parameter type: `string | undefined`
- Completion: local file system
- Code example:
```ts
CLI.command('char-count', 'count characters')
   .option('--content <file>', 'what file to use?')
   .action(async ({ content }) => console.log((await fs.readFile(content, 'utf-8')).length));
```
- Shell example: `cli char-count --content ./foo.txt`

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

- Specification: `<file:arg-name>`
- Parameter type: `string`
- Completion: local file system
- Code example:
```ts
CLI.command('exists', 'checks existance')
   .arg('<file:file-name>', 'what file to check?')
   .action(({ fileName }) => console.log(fs.existsSync(fileName)));
```
- Shell example: `cli exists /tmp/someFile.js`

#### Arg lists

- Specifications: `<arg-name...>` or `<file:arg-name...>`
- Parameter type: `string[]`
- Completions: none or local file system
- Code example:
```ts
CLI.command('exists', 'checks existance')
   .arg('<file:file-names...>', 'what files to check?')
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
     sub.arg('<str>').action(({ str, error }) => console[error ? 'error' : 'log'](str.trim()));
   })
   .subcommand('length', 'counts the chars', (sub) => {
     sub.arg('<str>').action(({ str, error }) => console[error ? 'error' : 'log'](str.length));
   })
```
- Shell examples:
```
cli string trim " foo"
cli string length "lorem ipsum"
```

## Extra features

`brocolito` makes use of some utilities that are also made available for your CLI.

- `complainAndExit(msg: string)`: Prints the given message in red and immediately stops the process without
                                  printing a whole error stack.
- `pc`: Default export of the [picocolors](https://www.npmjs.com/package/picocolors) package to add colors
        to your printed output.

## External dependencies

If you are using external dependencies, these have to be listed in your `package.json` under
`"dependencies"`. In case of build-in NodeJS dependencies, make sure to use the prefixed package
names, e.g. `node:fs` instead of `fs`. Otherwise, the dependencies might end up included in your
resulting bundle or aren't correctly resolved at all.

[push-image]: https://github.com/fdc-viktor-luft/brocolito/actions/workflows/push.yml/badge.svg
[push-url]: https://github.com/fdc-viktor-luft/brocolito/actions/workflows/push.yml
[npm-image]: https://img.shields.io/npm/v/brocolito.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/brocolito
