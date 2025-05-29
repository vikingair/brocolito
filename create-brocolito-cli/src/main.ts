import { CLI, pc } from "brocolito";
import prompts from "prompts";
import fs from "node:fs/promises";
import path from "node:path";
import {
  type SupportedRuntime,
  type SupportedPackageManagers,
  Templates,
} from "./templates";

const waitForSelect = async <T extends string = string>({
  msg,
  choices,
}: {
  msg: string;
  choices: Array<{ title: string; value: T }>;
}): Promise<T> => {
  const { choice } = await prompts(
    {
      type: "select",
      name: "choice",
      initial: 0,
      choices,
      message: msg,
      format: (v) => v.trim(),
    },
    // if the user aborted with Control + C
    {
      onCancel: () => {
        throw new Error("Process stopped");
      },
    },
  );
  return choice;
};

const selectRuntime = async (): Promise<SupportedRuntime> =>
  await waitForSelect({
    msg: "Choose your runtime",
    choices: [
      { title: "node", value: "node" },
      { title: "bun", value: "bun" },
      { title: "deno", value: "deno" },
    ],
  });

const selectName = async (): Promise<string> =>
  (
    await prompts(
      {
        type: "text",
        name: "name",
        message: "Name of your CLI:",
        validate: (name) => !!name,
        format: (v) => v.trim(),
      },
      {
        onCancel: () => {
          throw new Error("Process stopped");
        },
      },
    )
  ).name;

const selectPackageManager = async (): Promise<SupportedPackageManagers> =>
  await waitForSelect({
    msg: "Choose your package manager",
    choices: [
      { title: "pnpm", value: "pnpm" },
      { title: "npm", value: "npm" },
      { title: "yarn", value: "yarn" },
    ],
  });

CLI.command("run", "test description")
  .option("--name <string>", "the name of your CLI")
  .option("--runtime <bun|deno|node>", "the runtime of the CLI")
  .option("--packageManager <pnpm|npm|yarn>", "the runtime of the CLI")
  .action(async ({ name, runtime, packageManager }) => {
    name ??= await selectName();
    runtime ??= await selectRuntime();
    packageManager ??= await selectPackageManager();

    const srcDir = path.join(name, "src");
    await fs.mkdir(srcDir, { recursive: true });

    await fs.writeFile(
      path.join(name, "package.json"),
      Templates.packageJson(name, runtime),
    );
    await fs.writeFile(path.join(srcDir, "main.ts"), Templates.main);
    await fs.writeFile(
      path.join(srcDir, "main.test.ts"),
      runtime === "bun" ? Templates.testFileBun : Templates.testFile,
    );
    await fs.writeFile(
      path.join(name, "tsconfig.json"),
      Templates.tsConfig(runtime),
    );
    await fs.writeFile(
      path.join(name, "eslint.config.js"),
      Templates.eslintConfig,
    );
    await fs.writeFile(path.join(name, ".gitignore"), Templates.gitIgnore);

    console.log(
      `Run ${pc.cyan(`cd ${name}`) + pc.magenta(" && ") + pc.cyan(`${packageManager} install`)}`,
    );
  });

CLI.parse(process.argv.toSpliced(2, 0, "run"));
