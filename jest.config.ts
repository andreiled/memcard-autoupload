/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest";

const config: Config = {
    // Avoid unintended interference between individual tests within the same module
    // (tests in different modules are already fully isolated as far as mocking modules goes).
    clearMocks: true,
    resetMocks: true,

    collectCoverage: true,

    // Otherwise Jest will not report a lack of coverage for modules that are not exercised by any tests.
    collectCoverageFrom: ["src/**/*.{js,jsx,ts}"],

    coverageDirectory: "coverage",

    coverageProvider: "v8",

    // https://kulshekhar.github.io/ts-jest/docs/getting-started/installation/#jest-config-file
    preset: "ts-jest",

    // Report the result of each individual test
    verbose: true,
};

export default config;
