import * as github from '@actions/github';
import { execSync } from 'node:child_process';

const getPRNumber = () => {
  const prNumber =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    github.context.eventName === 'pull_request' ? github.context.payload.pull_request!.number : undefined;
  if (!prNumber && github.context.ref !== 'refs/heads/main') {
    const prNumberString = execSync('gh pr view --json number -q .number');
    console.log(`Detected PR number on branch ${github.context.ref}: #${prNumberString}`);
    return Number(prNumberString);
  }
  return prNumber;
};

export const getChangedFiles = async (baseSha?: string, currentSha = 'HEAD') => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN!);

  const prNumber = getPRNumber();

  // see https://octokit.github.io/rest.js/v19#pulls-list-files
  const files = prNumber
    ? await octokit.paginate(octokit.rest.pulls.listFiles, {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: prNumber,
        per_page: 100,
      })
    : // see https://octokit.github.io/rest.js/v19#repos-compare-commits-with-basehead
      await octokit.paginate(
        octokit.rest.repos.compareCommitsWithBasehead,
        {
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          basehead: `${baseSha}...${currentSha}`, // or use SHAs
          per_page: 100,
        },
        (r) => r.data.files || []
      );

  return files.flatMap(({ filename, status, previous_filename }) =>
    status === 'renamed' ? [filename, previous_filename as string] : filename
  );
};
