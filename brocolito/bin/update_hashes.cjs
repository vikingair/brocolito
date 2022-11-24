const fs = require('fs');
const path = require('path');

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

module.exports.updateHashes = (packageDir) => {
    const hashes = getHashes(packageDir);
    const hashesCacheFile = path.join(packageDir, 'build/hashes.json');

    fs.writeFileSync(hashesCacheFile, JSON.stringify(hashes));
};

module.exports.needsUpdate = (packageDir) => {
    const hashes = getHashes(packageDir);
    const hashesMap = Object.fromEntries(hashes);

    const hashesCacheFile = path.join(packageDir, 'build/hashes.json');
    const lastHashes = fs.existsSync(hashesCacheFile) ? JSON.parse(fs.readFileSync(hashesCacheFile, 'utf-8')) : undefined;

    return !lastHashes || hashes.length !== lastHashes.length || lastHashes.some(([name, hash]) => hashesMap[name] !== hash);
};
