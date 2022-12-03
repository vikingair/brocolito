#!/usr/bin/env node

const packageDir = require('path').join(__dirname, '..', '..');
const needsUpdate = process.env.CI ? undefined : require('brocolito/bin/update_hashes.cjs').needsUpdate(packageDir);

if (needsUpdate) {
  const notCompletion = !process.env.COMP_LINE;
  notCompletion && process.stdout.write('🥦Rebuilding ⚙️...');
  require('child_process').execSync('./node_modules/.bin/brocolito build', { cwd: packageDir, stdio: 'inherit' });
  notCompletion && process.stdout.clearLine();
  notCompletion && process.stdout.cursorTo(0);
}

require('../cli.cjs');
