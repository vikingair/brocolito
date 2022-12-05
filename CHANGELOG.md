# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
