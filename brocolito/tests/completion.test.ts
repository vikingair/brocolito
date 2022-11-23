import { describe, it, expect } from 'vitest';
import { _completion } from '../src/completion/completion';
import { State } from '../src/state';

describe('completion', () => {
  it('parses argument info for options', async () => {
    // empty commands
    expect(await _completion({ prev: State.name } as any)).toEqual(['--help']);
  });
});
