import { Command } from './types';

const commands: Record<string, Command> = {};
const aliases: Record<string, string> = {};

export const State = { commands, aliases };
