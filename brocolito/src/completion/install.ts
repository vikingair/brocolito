import pc from 'picocolors';
import { State } from '../state';

// TODO: Use "prompts"
export const showInstallInstruction = () =>
  console.log(`
To install auto-completion in ${pc.bold(pc.yellow('bash'))} add to your ${pc.blue('.bashrc')} the following:

. ${State.dir}/build/bash_completion.sh

To install auto-completion in ${pc.bold(pc.yellow('zsh'))} add to your ${pc.blue('.zshrc')} the following:

. ${State.dir}/build/zsh_completion.sh
`);
