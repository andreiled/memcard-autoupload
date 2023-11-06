import * as fs from "node:fs/promises";

export interface DirectoryDownloadConfig {
    readonly target: {
        readonly root: string;
        // TODO: provide support to customize nested directory naming.
    };
}

export interface DriveDownloadConfiguration {
    readonly [sourceDir: string]: DirectoryDownloadConfig;
}

export async function readAutoDownloadConfiguration(configDir?: string): Promise<DriveDownloadConfiguration> {
    try {
        const resolvedConfigDir = configDir ?? `${getLocalAppDataDir()}/auto-download`;
        // TODO: validate that the configuration is actually valid.
        return JSON.parse(await fs.readFile(`${resolvedConfigDir}/config.json`, { encoding: "utf8" }));
    } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
            throw new Error(
                // TODO: specify what command to actually run once it is implemented.
                "Auto-download configuration is missing on this computer, please run the ??? command to initialize the configuration.",
                { cause: error }
            );
        } else {
            throw error;
        }
    }
}

// TODO: is there a better place for this method (e.g. a separate module)?
// So far, the main reason why this function is declare here rather than as a private method of the Downloader class
// is to make it visible to tests in order to allow testing its logic outside of the wider more disruptive logic of that class.
export async function findAllSupportedSourceDirs(
    drivePath: string,
    configuration: DriveDownloadConfiguration
): Promise<[string, DirectoryDownloadConfig][]> {
    return (
        await Promise.all(
            Object.entries(configuration).map(
                async ([sourceDir, dirDownloadConfig]): Promise<[string, DirectoryDownloadConfig] | undefined> => {
                    const sourceDirPath = `${drivePath}/${sourceDir}`;
                    try {
                        await fs.access(sourceDirPath, fs.constants.R_OK | fs.constants.W_OK);
                    } catch (error) {
                        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                            return undefined;
                        } else {
                            throw error;
                        }
                    }

                    return [sourceDirPath, dirDownloadConfig];
                }
            )
        )
    ).filter((it) => !!it) as [string, DirectoryDownloadConfig][];
}

function getLocalAppDataDir() {
    return (
        /* Windows */ process.env.LOCALAPPDATA ||
        (process.platform == "darwin" ? `${process.env.HOME}/Library/Preferences` : `${process.env.HOME}/.local/share`)
    );
}
