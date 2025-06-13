import path from "node:path";

// we don't declare this type, because it should not be accessed by lib users
// see bin/build.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const injected = (globalThis as any).__BROCOLITO__ || {
  dir: path.resolve("."),
  name: "dummy",
  version: "dummy",
  aliases: undefined,
};
const { name, dir, version, aliases } = injected;

export const Meta: {
  name: string;
  dir: string;
  version: string;
  aliases: Record<string, string>;
} = {
  name,
  dir,
  version,
  aliases,
};
