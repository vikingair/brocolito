import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["node_modules", "dist"] },
  {
    files: ["**/*.{j,t}s", "**/*.{m,c}js"],
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
    files: ["tests/**.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      "no-undef": "off", // TS is taking care of that
    },
  },
);
