// https://github.com/actions/toolkit
import * as core from '@actions/core';
import * as github from '@actions/github';
import { Utils } from './utils';
import { CLI } from 'brocolito';

CLI.command('changed_files').action(async () => {
    const token = process.env.TOKEN!;

    const octokit = github.getOctokit(token);

    // see https://octokit.github.io/rest.js/v19#pulls-list-files
    const files = await Utils.paginate((params) => octokit.rest.pulls.listFiles(params), {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request!.number,
        per_page: 100,
    });

    core.setOutput('changed_files', files.flatMap(({ filename, status, previous_filename }) => status === 'renamed' ? [filename, previous_filename] : filename));
});

CLI.command('test').action(() => console.log('hello world'));

CLI.help();
CLI.parse();
