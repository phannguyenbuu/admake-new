import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config({ ignores: ["dist"] });

module.exports = {
  parser: '@typescript-eslint/parser', // parser cho TS
  parserOptions: {
    ecmaVersion: 'latest',            // hỗ trợ ES mới nhất
    sourceType: 'module',             // hỗ trợ import/export
    ecmaFeatures: {
      jsx: true,                     // bật JSX (lưu ý không phải `js: true`)
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-refresh/recommended',
  ],
  rules: {
    // các rule bạn muốn ghi đè thêm
  },
  settings: {
    react: {
      version: 'detect', // tự động detect version React đang dùng
    },
  },
  ignorePatterns: ['dist', 'node_modules'],
};
