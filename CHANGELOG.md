# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
