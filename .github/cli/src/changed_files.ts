import * as github from '@actions/github';
import { execSync } from 'node:child_process';
import { Utils } from './utils';

const getPRNumber = () => {
  const prNumber =
    github.context.eventName === 'pull_request' ? github.context.payload.pull_request!.number : undefined;
  if (!prNumber && github.context.ref !== 'refs/heads/main') {
    const prNumberString = execSync('gh pr view --json number -q .number');
    console.log(`Detected PR number on branch ${github.context.ref}: #${prNumberString}`);
    return Number(prNumberString);
  }
  return prNumber;
};

export const getChangedFiles = async (baseSha?: string) => {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN!);

  const prNumber = getPRNumber();

  // see https://octokit.github.io/rest.js/v19#pulls-list-files
  const files = prNumber
    ? await Utils.paginate((params) => octokit.rest.pulls.listFiles(params), {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: prNumber,
        per_page: 100,
        // see https://octokit.github.io/rest.js/v19#repos-compare-commits-with-basehead
      })
    : await Utils.paginate(
        async (params) => ({
          data: (await octokit.rest.repos.compareCommitsWithBasehead(params)).data.files || [],
        }),
        {
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          basehead: baseSha + '...HEAD', // or use SHAs
          per_page: 100,
        }
      );

  return files.flatMap(({ filename, status, previous_filename }) =>
    status === 'renamed' ? [filename, previous_filename] : filename
  );
};
