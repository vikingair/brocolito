# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.0.0] - 2025-06-??

### Changed

- Moved CLI alias registration from runtime to buildtime by requiring these to be done in `package.json` or `deno.json`.

For more detailed information please see [Migration Guide v6](https://github.com/vikingair/brocolito/blob/master/MIGRATIONGUIDE.md#600)

## [5.0.0] - 2025-06-03

### Changed

- Removed the utility `complainAndExit(...)`.
- A (sub)command can only have subcommands or an action, but not both.
- Calling any command containging subcommands that were not targeted will fail and show the help of this command.
- Options can only be passed after targeting the complete (sub)command.
- Completion will show only subcommands as long any exist and show only options for completed command targets.
- Options being passed multiple times without expecting multiple values, will simply omit all options but the last.
  This is inherited from the `parseArgs` of `node:util`.
- Removing dependency on `prompts`.
- `brocolito-bun` needs to be now `brocolito bun` as it targets the same script.
- Made `vite` an optional peer dependency.
- Passing options with single dash will interpret each character as short option, e.g. `-ab` is the same as writing `--a --b`.
  - This matches the Node CLI default behavior and is necessary for the new option short aliases.

For more detailed information please see [Migration Guide v5](https://github.com/vikingair/brocolito/blob/master/MIGRATIONGUIDE.md#500)

### Added

- Supporting Deno as CLI runtime
- Supporting for passing runtime args to all different supported runtimes
- Supporting option short aliases

### Fixed

- Invoking the CLI without any args will show the help instead of invoking the last registered command.
- Aliases did break the completion due to wrong cursor calculation.
- Completion was not considering to be happen in the middle of the line, when cursor is not at the end of line.

## [4.1.0] - 2024-09-08

### Added

- Support for completion functions for options and args of type string or file

## [4.0.0] - 2024-09-08

### Fixed

- Auto-Completion logic was wrongly completing on not yet submitted line args

### Added

- Support for static union typed args and options
- Support for mandatory options
- Support for multi options

### Changed

- Arg specification was closer aligned to option specification types
  - `.arg("<file:foo>", "...")` -> switch name and type: `.arg("<foo:file>", "...")`
- Option type e.g. `--foo <bar>` will now be interpreted as type `"bar"` instead of `string`

## [3.0.1] - 2024-09-06

### Fixed

- Auto-completion for files was not working properly

## [3.0.0] - 2024-05-02

### Changed

- Migrated to pute ESM build. Stopped using Common JS. You need to add `"type": "module"` to your `package.json`
  file and rerun the build to make everything work again.
  - As of now the package `brocolito` can still be included in CommonJS CLIs, but `brocolito build` does not support it any longer.
- Migration to Eslint v9 when generating a new CLI template.

## [2.4.4] - 2024-01-17

### Fixed

- Add padding when printing descriptions with new lines.

## [2.4.3] - 2024-01-15

### Fixed

- Show missing arg descriptions

## [2.4.2] - 2024-01-15

### Fixed

- Show correct usage instructions for args

## [2.4.1] - 2024-01-15

### Fixed

- Use top-level await for Bun runtime wrapper to support top-level await in used CLI main code

## [2.4.0] - 2024-01-13

### Added

- Supporting Bun as CLI runtime
  - Change your build script from `"build": "brocolito"` to `"build": "brocolito-bun"`
    and rerun the build command if you want to migrate.

## [2.3.3] - 2023-11-12

### Fixed

- Fix completion output for subcommands

## [2.3.1] - 2023-10-28

### Fixed

- Improved error messages when specifying invalid subcommands or arguments

## [2.3.0] - 2023-03-04

### Added

- Alias configuration for commands and subcommands
- Completion of options, subcommands and commands uses provided descriptions

### Fixed

- Completion of subcommands no longer lists sibling commands
- Completion of flags no longer uses boolean specifiers

## [2.2.3] - 2023-02-01

### Fixed

- Rebuilding of CLI code works now if `brocolito` is installed as workspace dependency.
- Updated dependencies (including vite@4)
- Library code is not minified anymore

## [2.2.2] - 2023-01-30

### Fixed

- Rebuilding of CLI code was missing env to find node executable on some machines.

## [2.2.1] - 2023-01-17

### Fixed

- Rebuilding of CLI code without TTY.
- Clearing of rebuilding info for not extended PATH.
- Forwarding of array options which caused wrong type assertions.

## [2.2.0] - 2022-12-05

### Added

- `brocolito completion` prompts now if automatic completion setup should be performed.
- `prompts` package is now re-exported from this package.

## [2.1.3] - 2022-12-03

### Fixed

- `brocolito completion` command is printing again completion instructions.

## [2.1.2] - 2022-11-30

### Fixed

- `brocolito` is now executable when installed with `npm`.

## [2.1.1] - 2022-11-30

### Fixed

- Tests of peers could not be executed because of missing global parameter injection.

## [2.1.0] - 2022-11-29

### Added

- Made `CLI.meta` accessible to library users.
  - If you made use of `CLI._state.name` or similar these properties are now available via
    `CLI.meta.name`.

## [2.0.0] - 2022-11-29

### Changed

- Instead of being based on `cac` package, the CLI code was completely rewritten from scratch
  in order to support various features required by many currently used CLIs.

## [1.0.0] - 2022-11-13

### Added

- First production ready release of `brocolito` being based on `cac`.
