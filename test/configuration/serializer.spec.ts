import * as fs from "node:fs/promises";
import * as os from "node:os";
import {
    DriveDownloadConfiguration,
    readAutoDownloadConfiguration,
    writeAutoDownloadConfiguration,
} from "../../src/configuration";

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

            expect(await readAutoDownloadConfiguration(`${__dirname}/.resources/valid-config-dir`)).toEqual(expected);
        });
    });

    describe("Given configuration file does not exist in specified directory", () => {
        it("Expect error", async () => {
            expect(readAutoDownloadConfiguration(`${__dirname}/.resources/invalid-config-dir`)).rejects.toThrow(
                /Auto-download configuration is missing on this computer.?/
            );
        });
    });
});

describe("writeAutoDownloadConfiguration", () => {
    const dummyConfig: DriveDownloadConfiguration = {
        DCIM: {
            target: {
                root: "/etc/all-my-photos",
            },
        },
    };

    describe("Given configuration file exists in specified directory", () => {
        it("Should overwrite the file", async () => {
            const configDir = await fs.mkdtemp(`${os.tmpdir()}/dummy-config-dir-`);
            await fs.writeFile(`${configDir}/config.json`, JSON.stringify({ XYZ: { target: {} } }));

            await writeAutoDownloadConfiguration(dummyConfig, configDir);

            expect(JSON.parse(await fs.readFile(`${configDir}/config.json`, { encoding: "utf8" }))).toEqual(
                dummyConfig
            );
        });
    });

    describe("Given neither configuration directory nor configuration file exist", () => {
        it("Should create configuration directory and write configuration to file", async () => {
            const mockUserDir = await fs.mkdtemp(`${os.tmpdir()}/dummy-user-dir-`);
            const configDir = `${mockUserDir}/auto-download`;

            await writeAutoDownloadConfiguration(dummyConfig, configDir);

            expect(JSON.parse(await fs.readFile(`${configDir}/config.json`, { encoding: "utf8" }))).toEqual(
                dummyConfig
            );
        });
    });
});
