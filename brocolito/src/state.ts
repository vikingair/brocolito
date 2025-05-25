import { type Command } from "./types.ts";

const commands: Record<string, Command> = {};
const aliases: Record<string, string> = {};

export const State = { commands, aliases };
