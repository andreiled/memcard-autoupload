import path from "node:path";
import { SequentialNamingScanner } from "../scanner";
import { readDirectoryCursor, saveDirectoryCursor } from "../source-cursor";
import {
    DirectoryDownloadConfig,
    DriveDownloadConfiguration,
    findAllSupportedSourceDirs,
    readAutoDownloadConfiguration,
} from "./configuration";
import { FileCopier } from "./file-copier";
import { GroupByDatePlacementStrategy, TargetPlacementStrategy } from "./placement-strategy";

export class Downloader {
    private readonly configurationPromise: Promise<DriveDownloadConfiguration> = readAutoDownloadConfiguration();
    private readonly fileCopier: FileCopier = new FileCopier({
        async onTargetAlreadyExists(sourceFile, targetFile) {
            console.warn(
                "%s already exists in %s: skip copying %s",
                path.basename(targetFile),
                path.dirname(targetFile),
                sourceFile
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
            console.info("[%s] Found %i new files in total (in this source directory)", sourceDir, newFiles.length);

            const placementStrategy = this.resolveTargetPlacementStrategy(configuration.target);
            for (const fileRelativePath of newFiles) {
                const targetFilePath = await placementStrategy.resolveTargetPath(`${sourceDir}/${fileRelativePath}`);
                console.log("[%s] Copy %s to %s", sourceDir, fileRelativePath, targetFilePath);
                await this.fileCopier.copy(`${sourceDir}/${fileRelativePath}`, targetFilePath);
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

    private resolveTargetPlacementStrategy(target: DirectoryDownloadConfig["target"]): TargetPlacementStrategy {
        // TODO: can check the type of the target configuration here.
        return new GroupByDatePlacementStrategy(target.root);
    }
}
