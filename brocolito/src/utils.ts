import pc from 'picocolors';

const complainAndExit = (errMsg: string, code = 1): never => {
  console.log(pc.red(errMsg));
  process.exit(code);
};

export const Utils = { complainAndExit, pc };
