// @ts-check

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["node_modules", "build"] },
  {
    files: ["**/*.{t,j}s"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier,
    },
    rules: {
      "prettier/prettier": "warn",
      "arrow-body-style": ["warn", "as-needed"],
      eqeqeq: ["error", "always"],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "no-var": "off",
    },
  },
  {
    files: ["tests/**.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
