import * as core from '@actions/core';
import * as github from '@actions/github';
import { Utils } from './utils';

const run = async () => {
    const token = process.env.TOKEN!;

    const octokit = github.getOctokit(token);

    const files = await Utils.paginate((params) => octokit.rest.pulls.listFiles(params), {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request!.number,
        per_page: 100,
    });

    core.setOutput('changed_files', files.map(({ filename }) => filename))
};

run();
