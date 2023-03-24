import { CLI, prompts } from "brocolito";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { Templates } from "./templates";

CLI.command("run", "test description").action(async () => {
  const { name } = await prompts({
    type: "text",
    name: "name",
    message: "Name of your CLI:",
    validate: (name) => !!name,
  });

  const srcDir = path.join(name, "src");
  await fs.mkdir(srcDir, { recursive: true });

  await fs.writeFile(
    path.join(name, "package.json"),
    Templates.packageJson(name)
  );
  await fs.writeFile(path.join(srcDir, "main.ts"), Templates.main);
  await fs.writeFile(path.join(srcDir, "main.test.ts"), Templates.testFile);
  await fs.writeFile(path.join(name, "tsconfig.json"), Templates.tsConfig);
  await fs.writeFile(path.join(name, ".eslintrc"), Templates.eslintConfig);
  await fs.writeFile(path.join(name, ".gitignore"), Templates.gitIgnore);

  const { packageManagerCmd } = await prompts({
    type: "select",
    name: "packageManagerCmd",
    message: "Choose your package manager",
    choices: [
      { title: "pnpm", value: "pnpm i" },
      { title: "npm", value: "npm i" },
      { title: "yarn", value: "yarn" },
    ],
    initial: 0,
  });
  execSync(packageManagerCmd, { cwd: name, env: { ...process.env } });
});

CLI.parse();
