import { expect } from "chai";
import { DirectoryDownloadConfig } from "../../../src/configuration";
import { findAllSupportedSourceDirs } from "../../../src/actions/download/downloader";

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
