#!/usr/bin/env node

const packageDir = require('path').join(__dirname, '..', '..');
const needsUpdate = process.env.CI ? undefined : require('brocolito/bin/update_hashes.cjs').needsUpdate(packageDir);

if (needsUpdate) {
    // TODO: Remove these logs after update or avoid them at all
    console.log('Detected a CLI code change: Rebuilding...');
    require('child_process').execSync('./node_modules/.bin/brocolito build', { cwd: packageDir, stdio: 'inherit' });
}

require('../cli.cjs');
