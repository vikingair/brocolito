// https://github.com/actions/toolkit
// https://octokit.github.io/rest.js/v19
// https://github.com/octokit/app-permissions/blob/main/generated/api.github.com.json
import * as core from "@actions/core";
import { CLI } from "brocolito";
import { initEnv } from "./env";
import { getChangedFiles, printFileTree } from "./files";

initEnv();

CLI.command("changed_files", "list changed files on GitHub workflows")
  .option(
    "--base-sha <string>",
    "Choose a base SHA to compare with (e.g. 41a6ef03). Will be ignored if PR number exists.",
  )
  .action(async ({ baseSha }) => {
    const changedFiles = await getChangedFiles(baseSha);

    // useful for debugging purpose
    printFileTree(changedFiles);
    core.setOutput("changed_files", changedFiles);
  });

CLI.command("hello", "test description")
  .option("--name <string>", "name to greet")
  .action(({ name = "world" }) => console.log(`hello ${name}`));

CLI.parse();
