import { describe, it, expect } from 'vitest';
import { _getHelp } from '../src/help';
import { Arguments } from '../src/arguments';

describe('arguments', () => {
  it('parses argument info for options', () => {
    expect(Arguments.deriveOptionInfo('--flag')).toEqual({ type: 'boolean', name: 'flag', prefixedName: '--flag' });
    expect(Arguments.deriveOptionInfo('--foo <bar>')).toEqual({ type: 'string', name: 'foo', prefixedName: '--foo' });
    expect(Arguments.deriveOptionInfo('--foo something')).toEqual({
      type: 'string',
      name: 'foo',
      prefixedName: '--foo',
    });
    expect(Arguments.deriveOptionInfo('--foo <file>')).toEqual({ type: 'file', name: 'foo', prefixedName: '--foo' });
  });

  it('parses argument info', () => {
    expect(Arguments.deriveInfo('<bar>')).toEqual({ type: 'string', multi: false });
    expect(Arguments.deriveInfo('<file:bar>')).toEqual({ type: 'file', multi: false });
    expect(Arguments.deriveInfo('<bar...>')).toEqual({ type: 'string', multi: true });
    expect(Arguments.deriveInfo('<file:bar...>')).toEqual({ type: 'file', multi: true });
  });
});
