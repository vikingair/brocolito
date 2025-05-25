import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} filePath
 * @returns {string}
 */
const getShortHashForFile = (filePath) => {
  const file = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(file).digest("hex").substring(0, 8);
};

/**
 * @param {string} dir
 * @returns {[string, string][]}
 */
const getHashEntries = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((fileOrDir) => {
    const fileOrDirName = path.join(dir, fileOrDir.name);
    if (fileOrDir.isFile()) {
      return [[fileOrDirName, getShortHashForFile(fileOrDirName)]];
    }
    return getHashEntries(fileOrDirName);
  });

/**
 * @param {string} dir
 * @returns {[string, string][]}
 */
const getHashes = (dir) => {
  const srcHashes = getHashEntries(path.join(dir, "src"));
  const packageJsonPath = path.join(dir, "package.json");
  return [
    [packageJsonPath, getShortHashForFile(packageJsonPath)],
    ...srcHashes,
  ];
};

/**
 * @param {string} packageDir
 */
export const updateHashes = (packageDir) => {
  const hashes = getHashes(packageDir);
  const hashesCacheFile = path.join(packageDir, "build/hashes.json");

  fs.writeFileSync(hashesCacheFile, JSON.stringify(hashes));
};

/**
 * @param {string} packageDir
 */
export const needsUpdate = (packageDir) => {
  const hashes = getHashes(packageDir);
  const hashesMap = Object.fromEntries(hashes);

  const hashesCacheFile = path.join(packageDir, "build/hashes.json");
  /** @type {typeof hashes} */
  const lastHashes = fs.existsSync(hashesCacheFile)
    ? JSON.parse(fs.readFileSync(hashesCacheFile, "utf-8"))
    : undefined;

  return (
    !lastHashes ||
    hashes.length !== lastHashes.length ||
    lastHashes.some(([name, hash]) => hashesMap[name] !== hash)
  );
};
