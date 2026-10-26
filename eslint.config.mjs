import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'out/**', 'node_modules/**', 'tests/__snapshots__/**'] },
  {
    files: ['**/*.{js,jsx,mjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs['recommended-latest'].rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
    },
  },
  {
    // Electron main process and build scripts run in Node (CommonJS for main/preload)
    files: ['src/main/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    files: ['tests/**/*.{js,mjs}', '*.config.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
];
