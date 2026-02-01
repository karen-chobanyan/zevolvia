module.exports = {
  root: true,
  ignorePatterns: ["node_modules", "dist", ".next"],
  overrides: [
    {
      files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
      extends: ["next/core-web-vitals"],
      rules: {
        "react/no-unescaped-entities": "off",
      },
    },
    {
      files: ["apps/api/**/*.{ts,js}"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      parserOptions: {
        sourceType: "module",
      },
      env: {
        node: true,
        es2020: true,
      },
      rules: {
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      },
    },
  ],
};
