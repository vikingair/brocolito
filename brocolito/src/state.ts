import { Command } from './types';

const name = 'cli';
const commands: Record<string, Command> = {};

export const State = { commands, name };
