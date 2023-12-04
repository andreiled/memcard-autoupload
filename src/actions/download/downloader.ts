import * as fs from "node:fs/promises";
import path from "node:path";
import {
    DirectoryDownloadConfig,
    DriveDownloadConfiguration,
    readAutoDownloadConfiguration,
} from "../../configuration";
import { SequentialNamingScanner } from "../../scanner";
import { readDirectoryCursor, saveDirectoryCursor } from "../../source-cursor";
import { FileCopier } from "./file-copier";
import { GroupByDatePlacementStrategy, TargetPlacementStrategy } from "./placement-strategy";
import { ProgressTracker } from "./progress";

export class Downloader {
    private readonly configurationPromise: Promise<DriveDownloadConfiguration> = readAutoDownloadConfiguration();

    private readonly progressTracker = new ProgressTracker();
    private readonly fileCopier: FileCopier = new FileCopier({
        onTargetAlreadyExists: async (sourceFile, targetFile) => {
            this.progressTracker.log(
                `${path.basename(targetFile)} already exists in ${path.dirname(targetFile)}: skip copying ${sourceFile}`
            );
            return { action: "skip" };
        },
    });

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

            this.progressTracker.stop();
        } else {
            console.warn("[%s] Could not find any supported directories: do nothing", drivePath);
        }
    }

    private async downloadNewFilesFromDir(sourceDir: string, configuration: DirectoryDownloadConfig) {
        const cursor = await readDirectoryCursor(sourceDir);
        if (!cursor) {
            this.progressTracker.log(
                `[${sourceDir}] Cursor file not found: this appears to be the first time we are processing this directory`
            );
        }

        const newFiles = await new SequentialNamingScanner({ ignoreDirs: [".auto-download"] }).findNewFiles({
            sourceDir,
            lastProcessedFile: cursor?.sequential?.lastProcessedFile,
        });

        if (newFiles.length > 0) {
            this.progressTracker.log(
                `[${sourceDir}] Found ${newFiles.length} new files in total (in this source directory)`
            );
            const progressBar = this.progressTracker.startTracking(sourceDir, newFiles.length);

            const placementStrategy = this.resolveTargetPlacementStrategy(configuration.target);
            for (const fileRelativePath of newFiles) {
                const targetFilePath = await placementStrategy.resolveTargetPath(`${sourceDir}/${fileRelativePath}`);

                progressBar.setStatusSummary(`${fileRelativePath} => ${targetFilePath}`);
                await this.fileCopier.copy(`${sourceDir}/${fileRelativePath}`, targetFilePath);
                progressBar.increment();
            }

            const lastProcessedFile = newFiles[newFiles.length - 1];
            progressBar.setStatusSummary(`Saving final cursor position: ${lastProcessedFile}`);

            await saveDirectoryCursor(sourceDir, {
                ...cursor,
                sequential: {
                    ...cursor?.sequential,
                    lastProcessedFile,
                },
            });
            progressBar.setStatusSummary(`Saved final cursor position: ${lastProcessedFile}`);
            progressBar.stop();
        } else {
            this.progressTracker.log(`[${sourceDir}] No new files found`);
        }
    }

    private resolveTargetPlacementStrategy(target: DirectoryDownloadConfig["target"]): TargetPlacementStrategy {
        // TODO: can check the type of the target configuration here.
        return new GroupByDatePlacementStrategy(target.root);
    }
}

// TODO: I wonder if there's a nicer way to put this function: one one hand:
// * it is nice to test its behavior on its own, so making it a method in the `Downloader` class does not look right
// * on the other hand, this function does not make much sense outside of its ues by `Downloader`
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
