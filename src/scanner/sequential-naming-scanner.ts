import { Dirent } from "node:fs";
import * as fs from "node:fs/promises";

import { indexOfNextElement } from "../utils/arrays";
import { getPathElements, pathStartsWith } from "../utils/path";
import { StringUtils } from "../utils/string";

export interface ScanParams {
    /**
     * Source directory to scan.
     */
    readonly sourceDir: string;
    /**
     * Last file processed during some previous scan.
     *
     * When provided, the new scan will start immediately after this file (i.e. with the first file created after it).
     */
    readonly lastProcessedFile?: string | string[];
}

/**
 * Scanner that relies on file names following some sort of consistent sequential naming schema
 * in order to identify all files newer than some previously processed file.
 */
export class SequentialNamingScanner {
    public async *findNewFiles(params: ScanParams): AsyncGenerator<string, void> {
        const { sourceDir, lastProcessedFile } = params;
        const lastProcessedPath = lastProcessedFile ? getPathElements(lastProcessedFile) : undefined;

        const dirEntries = await fs.readdir(sourceDir, { withFileTypes: true });
        dirEntries.sort((a, b) => StringUtils.compare(a.name, b.name));

        const unprocessedEntries = this.getUnprocessedEntries(
            sourceDir,
            dirEntries,
            (lastProcessedPath?.length ?? 0) > 0 ? lastProcessedPath![0] : undefined
        );

        for (const entry of unprocessedEntries) {
            if (entry.isDirectory()) {
                yield* this.findNewFiles({
                    sourceDir: `${sourceDir}/${entry.name}`,
                    // If diving into a directory that was partially processed before.
                    lastProcessedFile: pathStartsWith(lastProcessedPath, entry.name)
                        ? lastProcessedPath?.slice(1)
                        : undefined,
                });
            } else if (entry.isFile()) {
                yield `${sourceDir}/${entry.name}`;
            }
        }
    }

    private getUnprocessedEntries(sourceDir: string, entries: readonly Dirent[], lastProcessedFile?: string) {
        if (lastProcessedFile) {
            const firstUnprocessedEntryIndex = indexOfNextElement(entries, {
                compareTo: (other) => {
                    const nameComparisonResult = StringUtils.compare(lastProcessedFile, other.name);
                    if (nameComparisonResult != 0) {
                        return nameComparisonResult;
                    }

                    // Re-scan the last scanned directory to check for new files.
                    return other.isDirectory() ? -1 : 0;
                },
            });

            if (firstUnprocessedEntryIndex == 0) {
                console.info(
                    "[%s] None of the contents were processed before: will process all sub-folders and/or files",
                    sourceDir
                );
                return entries;
            } else if (firstUnprocessedEntryIndex > 0) {
                const previouslyProcessed = entries.slice(0, firstUnprocessedEntryIndex);
                console.info(
                    "[%s] Skip previously processed folders and/or files: %s",
                    sourceDir,
                    summarizeArray(previouslyProcessed, 5, (entry) => entry.name)
                );

                const unprocessedEntries = entries.slice(firstUnprocessedEntryIndex);
                console.info(
                    "[%s] New folders and/or files found: %s",
                    sourceDir,
                    summarizeArray(unprocessedEntries, 5, (entry) => entry.name)
                );
                return unprocessedEntries;
            } else {
                console.info("All files in %s were already processed before", sourceDir);
                return [];
            }
        } else {
            console.info("[%s] New folder found: will process all sub-folders and/or files", sourceDir);
            return entries;
        }
    }
}

function summarizeArray<T>(array: readonly T[], maxLength: number, toString: (_: T) => string): string {
    if (array.length > maxLength) {
        return [
            ...array.slice(0, Math.floor(maxLength / 2)).map(toString),
            "...",
            ...array.slice(array.length - maxLength + Math.floor(maxLength / 2)).map(toString),
        ].join(", ");
    } else {
        return array.map(toString).join(", ");
    }
}
