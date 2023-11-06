import { SequentialNamingScanner } from "../scanner";
import { readDirectoryCursor, saveDirectoryCursor } from "../source-cursor";
import {
    DirectoryDownloadConfig,
    DriveDownloadConfiguration,
    findAllSupportedSourceDirs,
    readAutoDownloadConfiguration,
} from "./configuration";

export class Downloader {
    private readonly configurationPromise: Promise<DriveDownloadConfiguration> = readAutoDownloadConfiguration();

    /**
     * Download all new files from all supported directories in the specified 'drive' directory.
     * @param drivePath path to the directory where the contents of a removable drive or memory card are mounted;
     * on Windows systems it would be a drive letter followed by a column while on *nix systems it would be an actual path starting with `/`.
     */
    public async downloadAllNewFiles(drivePath: string) {
        const configuration = await this.configurationPromise;

        const recognizedDirs = await findAllSupportedSourceDirs(drivePath, configuration);
        if (recognizedDirs.length > 0) {
            console.info(
                "[%s] Found %i supported director%s: %s",
                drivePath,
                recognizedDirs.length,
                recognizedDirs.length === 1 ? "y" : "ies",
                recognizedDirs.map(([sourceDir]) => sourceDir).join(", ")
            );

            for (const [sourceDir, dirDownloadConfig] of recognizedDirs) {
                // Note: intentionally processing each directory in a sequence
                // to avoid having multiple 'threads' reading and writing from/to the same physical device.
                await this.downloadNewFilesFromDir(sourceDir, dirDownloadConfig);
            }
        } else {
            console.warn("[%s] Could not find any supported directories: do nothing", drivePath);
        }
    }

    private async downloadNewFilesFromDir(sourceDir: string, configuration: DirectoryDownloadConfig) {
        const cursor = await readDirectoryCursor(sourceDir);
        if (!cursor) {
            console.warn(
                "[%s] Cursor file not found: this appears to be the first time we are processing this directory",
                sourceDir
            );
        }

        const newFiles = await new SequentialNamingScanner({ ignoreDirs: [".auto-download"] }).findNewFiles({
            sourceDir,
            lastProcessedFile: cursor?.sequential?.lastProcessedFile,
        });

        if (newFiles.length > 0) {
            console.info("[%s] Found %i new files", sourceDir, newFiles.length);

            for (const file of newFiles) {
                console.log("[%s] Copy %s to %s", sourceDir, file, configuration.target.root);
            }

            const lastProcessedFile = newFiles[newFiles.length - 1];
            console.info("[%s] Save final cursor position: %s", sourceDir, lastProcessedFile);

            saveDirectoryCursor(sourceDir, {
                ...cursor,
                sequential: {
                    ...cursor?.sequential,
                    lastProcessedFile,
                },
            });
        } else {
            console.info("[%s] No new files found: do nothing", sourceDir);
        }
    }
}