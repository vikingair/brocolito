import { describe, it, expect } from 'vitest';
import { _completion } from '../src/completion/completion';
import { State } from '../src/state';
import { Command } from '../src/types';

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

const getTabEnv = (line: string): any => {
  const prev = line.split(' ').filter(Boolean).at(-1);
  return { prev, line };
};

describe('completion', () => {
  it('top-level completion', async () => {
    // empty commands
    expect(await _completion(getTabEnv('cli'))).toEqual(['--help']);

    // some commands
    State.commands = {
      test: { ...dummyCommand, name: 'test', description: 'this is a test' },
      'other-command': { ...dummyCommand, name: 'other-command', description: 'some magic to do?' },
    };
    expect(await _completion(getTabEnv('cli'))).toEqual(['test', 'other-command', '--help']);
  });

  it('started option', async () => {
    State.commands = {
      test: {
        ...dummyCommand,
        name: 'test',
        options: {
          flag: { usage: '--flag', prefixedName: '--flag', description: 'some flag' },
          file: { usage: '--file <file>', prefixedName: '--file', description: 'some file' },
          str: { usage: '--str <string>', prefixedName: '--str', description: 'some string' },
        },
      },
    };
    expect(await _completion(getTabEnv('cli test --flag '))).toEqual(['true', 'false']);
    expect(await _completion(getTabEnv('cli test --file'))).toEqual(['__files__']);
    expect(await _completion(getTabEnv('cli test --str'))).toEqual([]);
  });

  it('filling args', async () => {
    State.commands = {
      test: {
        ...dummyCommand,
        name: 'test',
        args: [
          { usage: '<file:arg1>', name: 'arg1', description: 'some arg1' },
          { usage: '<arg2>', name: 'arg2', description: 'some arg2' },
        ],
        options: {
          flag: { usage: '--flag', prefixedName: '--flag', description: 'some flag' },
        },
      },
    };
    expect(await _completion(getTabEnv('cli test'))).toEqual(['__files__']);
    expect(await _completion(getTabEnv('cli test foo'))).toEqual([]);
    expect(await _completion(getTabEnv('cli test foo bar'))).toEqual(['--flag']);
  });

  it('filling subcommands and options', async () => {
    const options = {
      flag: { usage: '--flag', prefixedName: '--flag', description: 'some flag' },
      other: { usage: '--other <string>', prefixedName: '--other', description: 'some other' },
    };
    State.commands = {
      test: {
        ...dummyCommand,
        name: 'test',
        subcommands: {
          one: {
            ...dummyCommand,
            name: 'one',
            options: { ...options, more: { usage: '--more', prefixedName: '--more', description: 'some more' } },
          },
        },
        options,
      },
    };
    expect(await _completion(getTabEnv('cli test'))).toEqual(['one', '--flag', '--other']);
    expect(await _completion(getTabEnv('cli test one'))).toEqual(['--flag', '--other', '--more']);
    expect(await _completion(getTabEnv('cli test --other foo'))).toEqual(['--flag']);
  });
});
