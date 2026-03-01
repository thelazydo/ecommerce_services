module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
    setupFiles: [],
    moduleNameMapper: {
        "^@domain/(.*)$": "<rootDir>/src/domain/$1",
        "^@application/(.*)$": "<rootDir>/src/application/$1",
        "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
        "^@main/(.*)$": "<rootDir>/src/main/$1",
    },
    transform: {
        "^.+\\.[tj]s$": [
            "ts-jest",
            {
                tsconfig: {
                    allowJs: true,
                },
            },
        ],
    },
    transformIgnorePatterns: ["node_modules/(?!uuid)"],
};
