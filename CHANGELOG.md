# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
