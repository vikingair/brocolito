import * as github from '@actions/github';
import { execSync } from 'node:child_process';
import path from 'node:path';

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

export const getChangedFiles = async (baseSha = 'HEAD^1', currentSha = 'HEAD') => {
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

type Dir = { files: string[]; dirs: Record<string, Dir>; level: number };
export const printFileTree = (files: string[]) => {
  const root: Dir = { files: [], dirs: {}, level: 0 };
  files.forEach((f) => {
    const parts = f.split(path.sep);
    let currentDir = root;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        currentDir.files.push(part);
      } else if (!currentDir.dirs[part]) {
        const nextDir = { files: [], dirs: {}, level: currentDir.level + 1 };
        currentDir.dirs[part] = nextDir;
        currentDir = nextDir;
      } else {
        currentDir = currentDir.dirs[part];
      }
    });
  });
  const lines: Array<{ content: string; level: number }> = [];

  const addToLines = (dir: Dir) => {
    Object.entries(dir.dirs).forEach(([name, dir]) => {
      lines.push({ level: dir.level - 1, content: name });
      addToLines(dir);
    });

    dir.files.forEach((name) => {
      lines.push({ level: dir.level, content: name });
    });
  };

  addToLines(root);

  console.log(
    lines.reduce((prev, cur) => {
      const next = '  '.repeat(cur.level) + cur.content;
      return [prev, next].filter(Boolean).join('\n');
    }, '')
  );
};
