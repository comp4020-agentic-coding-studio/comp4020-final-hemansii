import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["spec/**/*.test.ts", "scripts/**/*.test.ts"],
    globalSetup: ["./spec/global-setup.ts"],
    // The spec files share one live dig site, so run them one at a time or
    // they race for the same buried sections.
    fileParallelism: false,
  },
});
