import pc from 'picocolors';

// TODO: Use "prompts"
// TODO: Use correct absolute path
export const showInstallInstruction = () =>
  console.log(`
To install auto-completion in ${pc.bold(pc.yellow('bash'))} add to your ${pc.blue('.bashrc')} the following:

. <CLI_DIR>/build/bash_completion.sh

To install auto-completion in ${pc.bold(pc.yellow('zsh'))} add to your ${pc.blue('.zshrc')} the following:

. <CLI_DIR>/build/zsh_completion.sh
`);
