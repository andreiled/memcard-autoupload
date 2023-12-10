import * as fs from "node:fs/promises";
import path from "node:path";
import { DriveDownloadConfiguration } from "./types";

export async function readAutoDownloadConfiguration(configDir?: string): Promise<DriveDownloadConfiguration> {
    try {
        // TODO: validate that the configuration is actually valid.
        return JSON.parse(await fs.readFile(resolveConfigFilePath(configDir), { encoding: "utf8" }));
    } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
            throw new Error(
                "Auto-download configuration is missing on this computer, please use the `init` command to initialize it.",
                { cause: error }
            );
        } else {
            throw error;
        }
    }
}

export async function writeAutoDownloadConfiguration(config: DriveDownloadConfiguration, configDir?: string) {
    const configFile = resolveConfigFilePath(configDir);

    await fs.mkdir(path.dirname(configFile), { recursive: true });
    await fs.writeFile(configFile, JSON.stringify(config));

    console.info("Configuration written to: %s", configFile);
}

function resolveConfigFilePath(configDir?: string): string {
    const resolvedConfigDir = configDir ?? `${getLocalAppDataDir()}/auto-download`;
    return `${resolvedConfigDir}/config.json`;
}

function getLocalAppDataDir() {
    return (
        /* Windows */ process.env.LOCALAPPDATA ||
        (process.platform == "darwin" ? `${process.env.HOME}/Library/Preferences` : `${process.env.HOME}/.local/share`)
    );
}
