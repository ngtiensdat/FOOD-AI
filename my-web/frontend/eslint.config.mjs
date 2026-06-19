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
      "next": {
        "rootDir": "my-web/frontend/"
      },
      "boundaries/elements": [
        { type: "base-components", pattern: "src/components/base/*" },
        { type: "features", pattern: "src/components/features/*" },
        { type: "services", pattern: "src/services/*" },
        { type: "hooks", pattern: "src/hooks/*" },
        { type: "lib", pattern: "src/lib/*" },
      ],
    },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
      ],
      "boundaries/dependencies": [
        "warn",
        {
          "default": "allow",
          "rules": [
            {
              "from": { "type": "base-components" },
              "disallow": [
                { "to": { "type": "features" } },
                { "to": { "type": "services" } },
                { "to": { "type": "hooks" } }
              ],
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
