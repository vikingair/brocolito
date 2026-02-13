import path from "node:path";
import { glob } from "node:fs/promises";

const getAllTargets = () =>
  Array.fromAsync(
    glob(["**/package.json", ".github/**/package.json"], {
      exclude: ["node_modules", "package.json"],
    }),
  );

type Target = { dir: string };

const getChangedDirs = async (changedFiles: string[]): Promise<string[]> => {
  const all = (await getAllTargets()).map((f) => path.dirname(f));
  const changed = [];

  for (const t of all) {
    for (const c of changedFiles) {
      // early exit
      if (c.startsWith(".github/actions") || c.startsWith(".github/workflows"))
        return all;

      if (c.startsWith(t)) {
        changed.push(t);
        break;
      }
    }
  }

  return changed;
};

export const getChangedTargets = async (
  changedFiles: string[],
): Promise<Target[]> => {
  const all = await getChangedDirs(changedFiles);
  return all.map((dir) => ({ dir }));
};
