// import * as core from '@actions/core';
import * as github from '@actions/github';

const run = async () => {
    // const token = core.getInput('token');
    const token = process.env.TOKEN!;

    const octokit = github.getOctokit(token)

    const { data: diff } = await octokit.rest.pulls.get({
        owner: "octokit",
        repo: "rest.js",
        pull_number: 1,
        mediaType: {
            format: "diff",
        },
    });

    console.log('>>>>');
    console.log(diff);
    console.log('<<<<');
};

run();
