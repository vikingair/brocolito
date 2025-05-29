#!/usr/bin/env node

import process from "node:process";
import { buildWithOpts } from "./build-common.js";

const opts = process.argv.slice(2);

if (opts.length) {
  await buildWithOpts(opts);
} else {
  await import("./build-vite.js");
}
