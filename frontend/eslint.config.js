import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // The two files below are not imported anywhere (dead code) and reference undefined names.
  // TODO: delete them or wire them up, then remove these ignores.
  globalIgnores([
    'dist',
    'src/features/ttr/TTRContainer.jsx',
    'src/features/auth/components/MascotExpression.jsx',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Baseline cleanup pending (about 46 unused variables): warn for now so real errors still fail CI.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      // Only affects dev hot reload (shadcn components export variants next to components).
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Node-side config files (Vite runs them in Node).
    files: ['vite.config.js', 'orval.config.ts'],
    languageOptions: { globals: globals.node },
  },
])
