import pc from "picocolors";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import prompts from "prompts";
import { Meta } from "../meta";
import { systemShell } from "./tabtab";
import { complainAndExit } from "../brocolito";

export const showInstallInstruction = async () => {
  const shell = systemShell();
  if (shell !== "bash" && shell !== "zsh")
    complainAndExit(
      'Completion is only supported for "zsh" and "bash" shells. Detected: ' +
        shell,
    );

  const shellRC = `.${shell}rc`;
  const command = `. ${Meta.dir}/build/${shell}_completion.sh`;

  const { wantsWrite } = await prompts({
    type: "confirm",
    name: "wantsWrite",
    message: `Append completion to your ${pc.blue(shellRC)}`,
    initial: true,
  });

  if (wantsWrite) {
    const shellRCFile = path.resolve(os.homedir(), shellRC);
    if (!fs.existsSync(shellRCFile))
      complainAndExit("Config file does not exist: " + shellRCFile);
    const shellRCContent = fs.readFileSync(shellRCFile, "utf-8");
    if (shellRCContent.includes(command)) return; // don't write the same line twice
    fs.writeFileSync(shellRCFile, `${shellRCContent.trim()}\n\n${command}\n`);
    console.log(
      pc.green("Completion should work now in new opened or sourced shells."),
    );
  } else {
    console.log(`
To install auto-completion in ${pc.bold(
      pc.yellow(shell),
    )} add to your ${pc.blue(shellRC)} the following:

${command}`);
  }
};
