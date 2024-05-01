// @ts-expect-error import not directly included
import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import ts from "typescript-eslint";

export default ts.config(
  { ignores: ["node_modules", "dist"] },
  {
    files: ["**/*.{j,t}s", "**/*.{m,c}js"],
    extends: [js.configs.recommended, ...ts.configs.recommended],
    plugins: {
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
    },
  },
  {
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
    },
  },
);
