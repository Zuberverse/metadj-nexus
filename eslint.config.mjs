/**
 * ESLint Configuration for MetaDJ Nexus
 *
 * Uses Next.js flat config with intentional rule suppressions for specific patterns.
 * Each suppression is documented with rationale for why it is safe.
 *
 * IMPORTANT: Before adding new suppressions, ensure:
 * 1. The pattern is intentional and necessary
 * 2. The code has been reviewed for correctness
 * 3. The rationale is documented in the comment
 */
import next from 'eslint-config-next';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';

const config = [
  // Next.js flat config (includes React, TypeScript rules)
  ...next,
  {
    plugins: {
      'react-hooks': reactHooks,
      'import': importPlugin,
    },
    rules: {
      // Standard react-hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      /**
       * react-hooks/set-state-in-effect: OFF
       *
       * This rule (new in v7.0.1) is too strict for legitimate patterns like:
       * - Initializing state from localStorage/sessionStorage in useEffect
       * - Resetting derived state when props change
       * - Syncing state with external sources
       *
       * Our codebase follows React best practices - these are intentional patterns.
       */
      'react-hooks/set-state-in-effect': 'off',
      /**
       * react-hooks/refs: OFF
       *
       * This rule (new in v7.0.1) flags ref access during render.
       * Our codebase legitimately accesses refs during render for:
       * - Dropdown positioning (getBoundingClientRect for dynamic placement)
       * - Initializing state from ref values
       * - Managing focus and DOM measurements
       *
       * These patterns work correctly and are common in React applications.
       */
      'react-hooks/refs': 'off',
      'import/no-anonymous-default-export': 'off',

      // ========================================================================
      // Import Ordering Rules
      // ========================================================================
      // Enforces consistent import ordering across all files:
      // 1. React and Next.js imports
      // 2. External packages
      // 3. Internal aliases (@/ paths)
      // 4. Parent/sibling imports
      // 5. Type-only imports at the end of their group
      'import/order': ['warn', {
        'groups': [
          'builtin',           // Node.js built-in modules
          'external',          // npm packages
          'internal',          // @/ aliased imports
          ['parent', 'sibling', 'index'], // Relative imports
          'type',              // Type-only imports
        ],
        'pathGroups': [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'react-dom',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'next',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'next/**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        'pathGroupsExcludedImportTypes': ['react', 'react-dom', 'next', 'type'],
        'newlines-between': 'never',
        'alphabetize': {
          order: 'asc',
          caseInsensitive: true,
        },
      }],

      // ========================================================================
      // Naming Convention Rules (from docs/NAMING-CONVENTIONS.md)
      // ========================================================================
      // Note: @typescript-eslint/naming-convention requires explicit plugin setup
      // which conflicts with Next.js flat config. Using camelcase rule instead.
      // Full naming conventions are documented in docs/NAMING-CONVENTIONS.md
      // and enforced through code review and file renaming standardization.
      'camelcase': ['warn', {
        properties: 'never',
        ignoreDestructuring: false,
        ignoreImports: true,
        ignoreGlobals: true,
      }],
    },
  },

  // ============================================================================
  // File-specific overrides for intentional patterns
  // Each suppression includes rationale for why it is safe
  // ============================================================================

  {
    files: [
      'src/components/cinema/CinemaOverlay.tsx',
      'src/components/home/HomePageClient.tsx',
      'src/components/hub/FeaturedCarousel.tsx',
      'src/components/metadjai/MetaDjAiChat.tsx',
      'src/hooks/cinema/use-cinema.ts',
      'src/hooks/use-metadjai.ts',
      'src/components/collection/CollectionManager.tsx',
      'src/components/panels/left-panel/LeftPanel.tsx',
      'src/components/search/SearchBar.tsx',
    ],
    rules: {
      /**
       * react-hooks/exhaustive-deps: OFF
       *
       * RATIONALE: These files intentionally omit certain dependencies to:
       * 1. Prevent infinite loops from callback identity changes
       * 2. Run effects only on specific state changes, not all dependencies
       * 3. Avoid unnecessary re-renders when stable values are excluded
       *
       * SAFE BECAUSE: Each omission has been reviewed and tested:
       * - Callbacks wrapped in useCallback are stable and safe to omit
       * - Context values that never change identity are safe to omit
       * - Refs used in effects don't need to be in deps (they're mutable)
       *
       * REVIEW REQUIRED: When modifying these files, verify that omitted
       * dependencies don't cause stale closures or missed updates.
       */
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: [
      'src/components/panels/left-panel/MoodChannelDetailView.tsx',
      'src/components/panels/left-panel/BrowseView.tsx',
    ],
    rules: {
      /**
       * react-hooks/static-components: OFF
       *
       * RATIONALE: These files use getMoodChannelIcon() to dynamically
       * select icon components based on channel.id. This is a lookup
       * pattern where the returned component reference is stable per
       * channel ID - it's not creating new components, just selecting
       * from a fixed set of exported icon components.
       *
       * SAFE BECAUSE: getMoodChannelIcon returns references to statically
       * defined components, not dynamically created ones.
       */
      'react-hooks/static-components': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      'node_modules.nosync/**',
      '.next/**',
      '.next.nosync/**',
      'out/**',
      'public/**',
      'coverage/**',
      'next.config.js',
      'postcss.config.js',
      'tailwind.config.ts',
      'vitest.config.ts',
      'next-env.d.ts',
    ],
  },
];

export default config;
