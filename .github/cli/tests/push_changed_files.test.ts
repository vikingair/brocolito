import { describe, it, expect } from 'vitest';
import { config } from 'dotenv';

// load GITHUB_TOKEN locally
config({ path: '.env.local' });

describe('push changed_files', () => {
  it('returns changed files of given push event', async () => {
    // given
    process.env.GITHUB_REPOSITORY = 'fdc-viktor-luft/brocolito';
    process.env.GITHUB_EVENT_NAME = 'push';
    process.env.GITHUB_REF = 'refs/heads/main';

    // load all modules with in env
    const module = await import('../src/changed_files');

    expect(await module.getChangedFiles('b5308cb5', 'f103c367')).toEqual([
      '.github/cli/package.json',
      '.github/cli/pnpm-lock.yaml',
      '.github/cli/src/main.ts',
      '.github/workflows/pr.yml',
      '.github/workflows/push.yml',
    ]);
  });
});
