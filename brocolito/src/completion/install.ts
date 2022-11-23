import pc from 'picocolors';

export const showInstallInstruction = () =>
  console.log(`
To install auto-completion for the vlt in ${pc.bold(pc.yellow('bash'))}...

Create a file ${pc.gray('/etc/bash_completion.d/vlt')} with the following content:

###-begin-vlt-completion-###
if type complete &>/dev/null; then
  _vlt_completion () {
    local words cword
    if type _get_comp_words_by_ref &>/dev/null; then
      _get_comp_words_by_ref -n = -n @ -n : -w words -i cword
    else
      cword="$COMP_CWORD"
      words=("\${COMP_WORDS[@]}")
    fi

    local si="$IFS"
    IFS=$'\\n' COMPREPLY=($(COMP_CWORD="$cword" \\
                           COMP_LINE="$COMP_LINE" \\
                           COMP_POINT="$COMP_POINT" \\
                           vlt completion -- "\${words[@]}" \\
                           2>/dev/null)) || return $?
    IFS="$si"
    if type __ltrim_colon_completions &>/dev/null; then
      __ltrim_colon_completions "\${words[cword]}"
    fi
  }
  complete -o default -F _vlt_completion vlt
fi
###-end-vlt-completion-###

To install auto-completion for the vlt in ${pc.bold(pc.yellow('zsh'))} use the following content instead:

 
###-begin-vlt-completion-###
if type compdef &>/dev/null; then
  _vlt_completion () {
    local reply
    local si=$IFS

    IFS=$'\\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" vlt completion -- "\${words[@]}"))
    IFS=$si

    _describe 'values' reply
  }
  compdef _vlt_completion vlt
fi
###-end-vlt-completion-###
`);
