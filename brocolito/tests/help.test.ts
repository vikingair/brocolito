import { describe, it, expect } from 'vitest';
import { State } from '../src/state';
import { _getHelp } from '../src/help';
import { Command, OptionMeta } from '../src/types';

const anyCallback: any = () => undefined;
const dummyCommand: Command = {
  name: 'test',
  line: 'test',
  description: 'run a test',
  subcommands: {},
  args: [],
  options: {},
  action: anyCallback,
  subcommand: anyCallback,
  arg: anyCallback,
  option: anyCallback,
};

describe('help', () => {
  it('prints top level help', () => {
    // given
    State.commands = {
      test: { ...dummyCommand, name: 'test', description: 'this is a test' },
      'other-command': { ...dummyCommand, name: 'other-command', description: 'some magic to do?' },
    };

    // when / then
    expect(_getHelp()).toMatchInlineSnapshot(`
      "Usage:
        $ cli <command> [options]

      Commands:
        test            this is a test
        other-command   some magic to do?
      "
    `);
  });

  it('prints command help with options', () => {
    expect(_getHelp({ ...dummyCommand, _action: anyCallback })).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test
      "
    `);

    expect(
      _getHelp({
        ...dummyCommand,
        _action: anyCallback,
        options: {
          foo: { usage: '--open', description: 'some bool flag' } as OptionMeta,
          bar: { usage: '--file <file:one>', description: 'some single file' } as OptionMeta,
          other: { usage: '--more <args...>', description: 'more args' } as OptionMeta,
        },
      })
    ).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test [options]

      Options:
        --open              some bool flag
        --file <file:one>   some single file
        --more <args...>    more args
      "
    `);
  });

  it('prints command with subcommands', () => {
    expect(
      _getHelp({
        ...dummyCommand,
        subcommands: { one: { ...dummyCommand, name: 'one', line: 'test one', description: 'subcommand one here' } },
      })
    ).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test <command> [options]

      Commands:
        one   subcommand one here
      "
    `);
  });

  it('prints command with optional subcommands', () => {
    expect(
      _getHelp({
        ...dummyCommand,
        _action: anyCallback,
        subcommands: { one: { ...dummyCommand, name: 'one', line: 'test one', description: 'subcommand one here' } },
      })
    ).toMatchInlineSnapshot(`
      "Help:
        run a test

      Usage:
        $ cli test [<command>] [options]

      Commands:
        one   subcommand one here
      "
    `);
  });

  it('prints subcommand', () => {
    expect(
      _getHelp({
        ...dummyCommand,
        name: 'one',
        line: 'test one',
        description: 'subcommand one here',
        subcommands: {
          two: { ...dummyCommand, name: 'two', line: 'test one two', description: 'subcommand two here' },
        },
        options: {
          foo: { usage: '--open', description: 'some bool flag' } as OptionMeta,
        },
      })
    ).toMatchInlineSnapshot(`
      "Help:
        subcommand one here

      Usage:
        $ cli test one <command> [options]

      Commands:
        two   subcommand two here

      Options:
        --open   some bool flag
      "
    `);
  });
});
