// @ts-check

import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import ts from "typescript-eslint";

export default ts.config(
  { ignores: ["node_modules", "build"] },
  {
    files: ["**/*.{t,j}s"],
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
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
