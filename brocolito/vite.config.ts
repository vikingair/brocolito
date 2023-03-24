/// <reference types="vitest" />
import { resolve } from "path";
import { readFileSync } from "fs";
import { defineConfig } from "vite";

const packageJSON = JSON.parse(readFileSync("package.json", "utf-8"));

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: {
        brocolito: resolve(__dirname, "src/brocolito.ts"),
      },
      fileName: (format, entryName) =>
        `${entryName}.${format === "cjs" ? "cjs" : "mjs"}`,
      formats: ["cjs", "es"],
    },
    // library code should not be minified according to this article
    // https://stackoverflow.com/a/48673965/15090924
    minify: false,
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [/^node:.*/, ...Object.keys(packageJSON.dependencies)],
    },
  },
  test: {
    setupFiles: ["./tests/setupTests.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
    },
  },
});
