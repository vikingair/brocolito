import { Command } from './types';

// we don't declare this type, because it should not be accessed by lib users
// see bin/build.mjs
const { name, dir, version } = (global as any).__BROCOLITO__; // eslint-disable-line @typescript-eslint/no-explicit-any

const commands: Record<string, Command> = {};
const aliases: Record<string, string> = {};

export const State = { commands, name, dir, version, aliases };
