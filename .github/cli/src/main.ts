// import * as core from '@actions/core';
import * as github from '@actions/github';

const run = async () => {
    // const token = core.getInput('token');
    const token = process.env.TOKEN!;

    const octokit = github.getOctokit(token);

    console.log('>>>>');
    console.log(github.context);
    console.log('<<<<');

    const { data: diff } = await octokit.rest.pulls.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.runNumber,
        mediaType: {
            format: "diff",
        },
    });

    console.log('>>>>');
    console.log(diff);
    console.log('<<<<');
};

run();
