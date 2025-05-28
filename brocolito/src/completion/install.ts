import pc from "picocolors";
import { Meta } from "../meta.ts";
import { systemShell } from "./tabtab.ts";

export const showInstallInstruction = async () => {
  const shell = systemShell();
  if (shell !== "bash" && shell !== "zsh") {
    throw new Error(
      'Completion is only supported for "zsh" and "bash" shells. Detected: ' +
        shell,
    );
  }

  const shellRC = `.${shell}rc`;
  const command = `. ${Meta.dir}/build/${shell}_completion.sh`;

  console.log(`
To install auto-completion in ${pc.bold(
    pc.yellow(shell),
  )} add to your ${pc.blue(shellRC)} the following:

${command}`);
};
