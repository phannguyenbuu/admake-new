import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config({ ignores: ["dist"] });

module.exports = {
  parser: '@typescript-eslint/parser', // parser cho TS
  parserOptions: {
    ecmaVersion: 'latest', // hỗ trợ ES mới nhất
    sourceType: 'module', // hỗ trợ import/export
    ecmaFeatures: {
      jsx: true, // nếu dùng react jsx
    },
  },
  plugins: ['@typescript-eslint', 'react'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
  ],
  rules: {
    // các rule khác
  }
};
