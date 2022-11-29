// we don't declare this type, because it should not be accessed by lib users
// see bin/build.mjs
const { name, dir, version } = (global as any).__BROCOLITO__; // eslint-disable-line @typescript-eslint/no-explicit-any

export const Meta: { name: string; dir: string; version: string } = { name, dir, version };
