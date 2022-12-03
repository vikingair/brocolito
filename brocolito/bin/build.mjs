#!/usr/bin/env node

import path from 'path';
import { build } from 'vite';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const packageJSON = JSON.parse(await fs.readFile('package.json', 'utf-8'));
const VALID_NAME = /^[a-zA-Z0-9_-]+$/;
if (!VALID_NAME.test(packageJSON.name)) {
  throw new Error('Please use valid name for the CLI in your package.json. Satisfying the constraint: ' + VALID_NAME);
}

// https://vitejs.dev/config/
await build({
  logLevel: 'error',
  build: {
    lib: {
      entry: path.resolve('src/main.ts'),
      fileName: (_format) => 'cli.cjs',
      formats: ['cjs'],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [/^node:.*/, ...Object.keys(packageJSON.dependencies)],
      output: {
        dir: 'build',
      },
    },
  },
});

// add global state
const globalState = { name: packageJSON.name, dir: path.resolve('.'), version: packageJSON.version };
const cliFile = path.resolve('./build/cli.cjs');
const cliContent = await fs.readFile(cliFile, 'utf-8');
await fs.writeFile(
  cliFile,
  cliContent.replace(/^"use strict";/, `"use strict";global.__BROCOLITO__=${JSON.stringify(globalState)};`)
);

// update file hashes for hot reload before next execution
if (!process.env.CI) (await import('./update_hashes.cjs')).updateHashes(path.resolve('.'));

// create execution wrapper
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runFile = path.join(__dirname, 'run.cjs');
const binDir = path.resolve('./build/bin');
const binFile = path.join(binDir, packageJSON.name);
await fs.mkdir(binDir, { recursive: true });
await fs.cp(runFile, binFile);
await fs.chmod(binFile, '744');

// copy completion scripts into build dir
const bashCompletion = await fs.readFile(path.join(__dirname, 'bash_completion.sh'), 'utf-8');
const zshCompletion = await fs.readFile(path.join(__dirname, 'zsh_completion.sh'), 'utf-8');
await fs.writeFile(path.resolve('./build/bash_completion.sh'), bashCompletion.replaceAll('BRO', packageJSON.name));
await fs.writeFile(path.resolve('./build/zsh_completion.sh'), zshCompletion.replaceAll('BRO', packageJSON.name));

if (!process.env.PATH.split(':').includes(binDir))
  console.log(`
To make the CLI ${packageJSON.name} globally accessible, you have to run this:
export PATH="${binDir}:$PATH"`);
