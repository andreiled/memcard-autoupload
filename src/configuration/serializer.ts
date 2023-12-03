import * as fs from "node:fs/promises";
import { DriveDownloadConfiguration } from "./types";

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

function getLocalAppDataDir() {
    return (
        /* Windows */ process.env.LOCALAPPDATA ||
        (process.platform == "darwin" ? `${process.env.HOME}/Library/Preferences` : `${process.env.HOME}/.local/share`)
    );
}
