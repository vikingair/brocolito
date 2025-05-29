# Migration Guide

You can find here tips for migrating breaking changes.

## 5.0.0

- Replace all usages of `complainAndExit(...)` by `throw new Error(...)`
- If you were using `prompts` imported from `brocolito`, install `@types/prompts` and `prompts` dependencies yourself
  and change your imports to `import prompts from "prompts"`.
- Replace `brocolito-bun` by `brocolito bun` in your "scripts" if you were using bun as runtime.
- If you are using the single file compilation powered by `vite`, you will need to install `vite` if you didn't install `vitest` yet.
