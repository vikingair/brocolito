// https://github.com/actions/toolkit
import * as core from '@actions/core';
import * as github from '@actions/github';
import { Utils } from './utils';
import { CLI } from 'brocolito';
import { config } from 'dotenv';

CLI.name('bro');

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
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN!);

    // see https://octokit.github.io/rest.js/v19#pulls-list-files
    const files = github.context.eventName === 'pull_request' ? await Utils.paginate((params) => octokit.rest.pulls.listFiles(params), {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request!.number,
        per_page: 100,
        // see https://octokit.github.io/rest.js/v19#repos-compare-commits-with-basehead
    }) : (await Utils.paginate(async (params) => ({ data: (await octokit.rest.repos.compareCommitsWithBasehead(params)).data.files || [] }), {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        basehead: baseSha + '...HEAD', // or use SHAs
        per_page: 100,
    }));

    core.setOutput('changed_files', files.flatMap(({ filename, status, previous_filename }) => status === 'renamed' ? [filename, previous_filename] : filename));
});

CLI.command('hello', 'test description').option('--name <string>', 'name to greet').action(() => console.log('hello world'));

CLI.parse();
