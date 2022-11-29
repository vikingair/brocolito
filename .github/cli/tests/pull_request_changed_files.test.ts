import { describe, it, expect } from 'vitest';
import { config } from 'dotenv';

// load GITHUB_TOKEN locally
config({ path: '.env.local' });

describe('pull_request changed_files', () => {
  it('returns changed files of given pull_request event', async () => {
    // given
    process.env.GITHUB_REPOSITORY = 'fdc-viktor-luft/brocolito';
    process.env.GITHUB_EVENT_NAME = 'pull_request';
    process.env.GITHUB_EVENT_PATH = './tests/pull_request_payload.json';

    // load all modules with in env
    const module = await import('../src/changed_files');

    expect(await module.getChangedFiles()).toEqual([
      '.github/cli/package.json',
      '.github/cli/pnpm-lock.yaml',
      'brocolito/bin/build.mjs',
      'brocolito/bin/run.cjs',
      'brocolito/package.json',
      'brocolito/src/brocolito.ts',
      'brocolito/vite.config.ts',
    ]);
  });
});
