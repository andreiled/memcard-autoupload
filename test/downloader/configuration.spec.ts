/* eslint-disable-next-line @typescript-eslint/no-var-requires */
require("chai").use(require("chai-as-promised"));

import { expect } from "chai";
import {
    DirectoryDownloadConfig,
    DriveDownloadConfiguration,
    findAllSupportedSourceDirs,
    readAutoDownloadConfiguration,
} from "../../src/downloader/configuration";

describe("readAutoDownloadConfiguration", () => {
    describe("Given configuration file exists in specified directory", () => {
        it("Expect valid configuration", async () => {
            // Define this as a separate variable to leverage tsc to verify that the expectation used by the test
            // matches the corresponding type declaration.
            const expected: DriveDownloadConfiguration = {
                DCIM: {
                    target: {
                        root: "/etc/all-my-photos",
                    },
                },
            };

            expect(await readAutoDownloadConfiguration(`${__dirname}/.resources/valid-config-dir`)).to.be.deep.equal(
                expected
            );
        });
    });

    describe("Given configuration file does not exist in specified directory", () => {
        it("Expect error", async () => {
            expect(readAutoDownloadConfiguration(`${__dirname}/.resources/invalid-config-dir`)).to.be.rejectedWith(
                Error,
                /Auto-download configuration is missing on this computer.?/
            );
        });
    });
});

describe("findAllSupportedSourceDirs", () => {
    const testConfiguration = {
        DCIM: {
            target: {
                root: "/etc/all-my-photos",
            },
        },
        CANNOT_EXIST: {
            target: {
                root: "/tmp",
            },
        },
    };

    function composeParameterizedTestCase(
        testDriveDir: string,
        ...expectedDirsConfigs: readonly [string, DirectoryDownloadConfig][]
    ) {
        return async () => {
            expect(
                await findAllSupportedSourceDirs(`${__dirname}/.resources/${testDriveDir}`, testConfiguration)
            ).to.to.deep.equal(expectedDirsConfigs);
        };
    }

    describe("Given no supported directories exist", () => {
        it("Expect empty result", composeParameterizedTestCase("empty-drive"));
    });

    describe("Given one supported directory exists", () => {
        it(
            "Expect one supported directory path with associated download configuration",
            composeParameterizedTestCase("dummy-drive-1", [
                `${__dirname}/.resources/dummy-drive-1/DCIM`,
                {
                    target: {
                        root: "/etc/all-my-photos",
                    },
                },
            ])
        );
    });
});
