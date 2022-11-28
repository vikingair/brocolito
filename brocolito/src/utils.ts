import pc from 'picocolors';

const complainAndExit = (errMsg: string, code = 1): never => {
  if (process.env.NODE_ENV === 'test') {
    throw new Error(errMsg);
  } else {
    console.log(pc.red(errMsg));
    process.exit(code);
  }
};

export const Utils = { complainAndExit, pc };
