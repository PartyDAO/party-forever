import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores (equivalent to Biome files.ignore)
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/abis/**",
      "**/configs/**",
      "**/generated_exports.ts",
      "**/party-addresses/**"
    ]
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Unused imports (auto-fixable, matches Biome's noUnusedImports)
  {
    plugins: {
      "unused-imports": unusedImports
    },
    rules: {
      "unused-imports/no-unused-imports": "warn"
    }
  },

  // TypeScript-specific rule overrides
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "off"
    }
  },

  // React rules (for all apps)
  {
    files: [
      "apps/frontend/**/*.{ts,tsx}",
      "apps/create/**/*.{ts,tsx}",
      "apps/partybid/**/*.{ts,tsx}",
      "apps/landing/**/*.{ts,tsx}"
    ],
    plugins: {
      react,
      "react-hooks": reactHooks
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs["recommended-latest"].rules,
      "react-hooks/exhaustive-deps": "warn"
    }
  },

  // Disallow importing useAccount from wagmi in frontend and partybid
  {
    files: ["apps/frontend/**/*.{ts,tsx}", "apps/partybid/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "wagmi",
              importNames: ["useAccount"],
              message: 'Import useAccount from "@party-forever/ui" instead of wagmi.'
            }
          ]
        }
      ]
    }
  },

  // Allow SimulatedWalletContext.tsx to import useAccount from wagmi (it's the wrapper itself)
  {
    files: ["packages/ui/src/SimulatedWalletContext.tsx"],
    rules: {
      "no-restricted-imports": "off"
    }
  },

  // Prettier compat (must be last)
  prettierConfig
);
