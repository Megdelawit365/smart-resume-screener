import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {

        environment: "node",
        globals: false,
        env: {
            NODE_ENV: "test"
        },
        fileParallelism: false,
        hookTimeout: 30000,
    },
});