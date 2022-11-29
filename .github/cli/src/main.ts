// https://github.com/actions/toolkit
// https://octokit.github.io/rest.js/v19
// https://github.com/octokit/app-permissions/blob/main/generated/api.github.com.json
import * as core from '@actions/core';
import { CLI } from 'brocolito';
import { config } from 'dotenv';
import { getChangedFiles } from './changed_files';

// for local usage you want to set some ENV variables that are natively available in GitHub workflows
// e.g.
/*
# github.context.repo.owner/github.context.repo.repo
GITHUB_REPOSITORY=fdc-viktor-luft/brocolito
GITHUB_TOKEN=ghp_***
# github.context.eventName (e.g. "pull_request" or "push")
GITHUB_EVENT_NAME=pull_request
# the herein JSON file will be parsed and attached to "github.context.payload"
# Leave empty and "github.context.payload" will be an empty object
GITHUB_EVENT_PATH=<path_to_json_file>
*/
config({ path: '.env.local' });

CLI.command('changed_files', 'list changed files on GitHub workflows')
  .option('--base-sha <string>', 'Choose a base SHA to compare with on non-pull request events (e.g. 41a6ef03)')
  .action(async ({ baseSha = 'HEAD^1' }) => {
    const changedFiles = await getChangedFiles(baseSha);

    core.setOutput('changed_files', changedFiles);
  });

CLI.command('hello', 'test description')
  .option('--name <string>', 'name to greet')
  .action(() => console.log('hello world'));

CLI.parse();
