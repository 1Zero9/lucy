import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".next/**",
      ".wrangler/**",
      ".vinext/**",
      "node_modules/**",
      "worker-configuration.d.ts",
      "next-env.d.ts",
      "public/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.worker }
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Only the two time-tested hook-correctness rules. eslint-plugin-react-hooks
      // v7's "recommended" also bundles React Compiler diagnostics (refs,
      // immutability, preserve-manual-memoization, ...) — this project doesn't
      // use React Compiler, so those are speculative noise here, not bugs.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { ...globals.node } }
  }
);
