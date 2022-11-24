import { describe, it, expect } from 'vitest';
import { _getHelp } from '../src/help';
import { Arguments } from '../src/arguments';

describe('arguments', () => {
  it('parses argument info for options', () => {
    expect(Arguments.deriveOptionInfo('--flag')).toEqual({ type: 'boolean', multi: false });
    expect(Arguments.deriveOptionInfo('--foo <bar>')).toEqual({ type: 'string', multi: false });
    expect(Arguments.deriveOptionInfo('--foo <file>')).toEqual({ type: 'file', multi: false });
    expect(Arguments.deriveOptionInfo('--foo <bar...>')).toEqual({ type: 'string', multi: true });
    expect(Arguments.deriveOptionInfo('--foo <file...>')).toEqual({ type: 'file', multi: true });
  });

  it('parses argument info', () => {
    expect(Arguments.deriveInfo('<bar>')).toEqual({ type: 'string', multi: false });
    expect(Arguments.deriveInfo('<file:bar>')).toEqual({ type: 'file', multi: false });
    expect(Arguments.deriveInfo('<bar...>')).toEqual({ type: 'string', multi: true });
    expect(Arguments.deriveInfo('<file:bar...>')).toEqual({ type: 'file', multi: true });
  });
});
