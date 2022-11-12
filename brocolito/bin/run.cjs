#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageDir = path.join(__dirname, '..', '..');

const getShortHashForFile = (filePath) => {
    const file = fs.readFileSync(filePath);
    return require('crypto').createHash('md5').update(file).digest('hex').substring(0, 8);
};

const getHashEntries = (dir) => {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((fileOrDir) => {
        const fileOrDirName = path.join(dir, fileOrDir.name);
        if (fileOrDir.isFile()) return [[fileOrDirName, getShortHashForFile(fileOrDirName)]];
        return getHashEntries(fileOrDirName);
    });
};
const getHashes = (dir) => {
    const srcHashes = getHashEntries(path.join(dir, 'src'));
    const packageJsonPath = path.join(dir, 'package.json');
    return [[packageJsonPath, getShortHashForFile(packageJsonPath)], ...srcHashes];
};

const getUpdateHashes = () => {
    const hashes = getHashes(packageDir);
    const hashesMap = Object.fromEntries(hashes);

    const hashesCacheFile = path.join(__dirname, '../hashes.json');
    const lastHashes = fs.existsSync(hashesCacheFile) ? JSON.parse(fs.readFileSync(hashesCacheFile, 'utf-8')) : undefined;

    const needsUpdate = !lastHashes || hashes.length !== lastHashes.length || lastHashes.some(([name, hash]) => hashesMap[name] !== hash);

    return needsUpdate ? () => fs.writeFileSync(hashesCacheFile, JSON.stringify(hashes)) : undefined;
}

const updateHashes = process.env.CI ? undefined : getUpdateHashes();

if (updateHashes) {
    console.log('Detected a CLI code change: Rebuilding...');
    require('child_process').execSync('./node_modules/.bin/brocolito build', { cwd: packageDir, stdio: 'inherit' });
    updateHashes();
}

require('../cli.cjs');
