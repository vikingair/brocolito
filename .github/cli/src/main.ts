// import * as core from '@actions/core';
import * as github from '@actions/github';

const run = async () => {
    // const token = core.getInput('token');
    const token = process.env.TOKEN!;

    const octokit = github.getOctokit(token);

    const { data: files } = await octokit.rest.pulls.listFiles({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request!.number,
    });

    console.log('>>>>');
    console.log(files.map(({ filename }) => filename));
    console.log('<<<<');
};

run();
