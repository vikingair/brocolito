# Migration Guide

You can find here tips for migrating breaking changes.

## 5.0.0

- Replace all usages of `complainAndExit(...)` by `throw new Error(...)`
- If you were using `prompts` imported from `brocolito`, install `@types/prompts` and `prompts` dependencies yourself
  and change your imports to `import prompts from "prompts"`.
