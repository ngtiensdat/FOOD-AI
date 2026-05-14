import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "unused-imports": unusedImports,
      "boundaries": boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "base-components", pattern: "src/components/base/*" },
        { type: "features", pattern: "src/components/features/*" },
        { type: "services", pattern: "src/services/*" },
        { type: "hooks", pattern: "src/hooks/*" },
        { type: "lib", pattern: "src/lib/*" },
      ],
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
      ],
      "boundaries/element-types": [
        "error",
        {
          "default": "allow",
          "rules": [
            {
              "from": "base-components",
              "disallow": ["features", "services", "hooks"],
              "message": "Base components should be pure and not depend on features or services."
            }
          ]
        }
      ],
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
