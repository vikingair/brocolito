import path from "node:path";

(globalThis as any).__BROCOLITO__ = {
  name: "cli",
  dir: path.resolve("."),
  version: "1.2.3",
};
