/** @jest-config-loader ts-node */
import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "^@application/(.*)$": "<rootDir>/src/application/$1",
        "^@domain/(.*)$": "<rootDir>/src/domain/$1",
        "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
        "^@main/(.*)$": "<rootDir>/src/main/$1",
    },
    testMatch: ["**/__tests__/**/*.test.ts"],
    setupFiles: ["<rootDir>/src/main/__tests__/setup.ts"],
};

export default config;
