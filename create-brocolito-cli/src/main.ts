import { CLI, pc } from "brocolito";
import prompts from "prompts";
import fs from "node:fs/promises";
import path from "node:path";
import {
  type SupportedRuntime,
  type SupportedPackageManagers,
  Templates,
} from "./templates";

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

const selectPackageManager = async (): Promise<SupportedPackageManagers> =>
  await waitForSelect({
    msg: "Choose your package manager",
    choices: [
      { title: "pnpm", value: "pnpm" },
      { title: "npm", value: "npm" },
      { title: "yarn", value: "yarn" },
    ],
  });

const selectTestFramwork = async (
  runtime: SupportedRuntime,
): Promise<"runtime" | "vitest" | "none"> =>
  await waitForSelect({
    msg: "Choose your test framework",
    choices: [
      { title: `${runtime} (native)`, value: "runtime" },
      { title: "vitest", value: "vitest" },
      { title: "none", value: "none" },
    ],
  });

CLI.command("run", "test description")
  .option("--name <string>", "the name of your CLI")
  .option("--runtime <bun|deno|node>", "the runtime of the CLI")
  .option(
    "--test-framework <runtime|vitest|none>",
    "the test framework to set up",
  )
  .option(
    "--package-manager <pnpm|npm|yarn>",
    "the package manager to set up (ignored for runtime=deno)",
  )
  .action(async ({ name, runtime, packageManager, testFramework }) => {
    name ??= await selectName();
    runtime ??= await selectRuntime();
    testFramework ??= await selectTestFramwork(runtime);
    packageManager ??=
      runtime === "deno" ? undefined : await selectPackageManager();

    const srcDir = path.join(name, "src");
    await fs.mkdir(srcDir, { recursive: true });

    const packageJson = Templates.packageJson(name, runtime, testFramework);
    await fs.writeFile(
      path.join(name, packageJson.fileName),
      JSON.stringify(packageJson.content, null, 2) + "\n",
    );
    await fs.writeFile(path.join(srcDir, "main.ts"), Templates.main);
    if (testFramework !== "none") {
      await fs.writeFile(
        path.join(srcDir, "main.test.ts"),
        Templates.testFile(
          testFramework === "runtime" ? runtime : testFramework,
        ),
      );
    }

    if (runtime !== "deno") {
      await fs.writeFile(
        path.join(name, "tsconfig.json"),
        Templates.tsConfig(runtime, testFramework),
      );
      await fs.writeFile(
        path.join(name, "eslint.config.js"),
        Templates.eslintConfig,
      );
    }
    await fs.writeFile(path.join(name, ".gitignore"), Templates.gitIgnore);

    if (runtime === "deno") {
      console.log(
        `Run ${[pc.cyan(`cd ${name}`), pc.cyan("deno install"), pc.cyan("deno task build")].join(pc.magenta(" && "))}`,
      );
    } else {
      console.log(
        `Run ${[pc.cyan(`cd ${name}`), pc.cyan(`${packageManager} install`), pc.cyan(`${packageManager} run build`)].join(pc.magenta(" && "))}`,
      );
    }
  });

CLI.parse(process.argv.toSpliced(2, 0, "run"));
