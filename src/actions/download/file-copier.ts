import * as fs from "node:fs/promises";
import path from "node:path";

export class FileCopier {
    private readonly createdDirsCache: Set<string> = new Set();

    public constructor(private readonly handlers: FileCopyEventsHandler = {}) {}

    public async copy(sourceFile: string, targetFile: string) {
        const targetDir = path.dirname(targetFile);
        if (!this.createdDirsCache.has(targetDir)) {
            await fs.mkdir(targetDir, { recursive: true });
            this.createdDirsCache.add(targetDir);
        }

        try {
            await fs.copyFile(sourceFile, targetFile, fs.constants.COPYFILE_EXCL);
        } catch (e) {
            if ((e as NodeJS.ErrnoException)?.code === "EEXIST" && !!this.handlers?.onTargetAlreadyExists) {
                const result = await this.handlers.onTargetAlreadyExists(sourceFile, targetFile);
                if (result.action === "overwrite") {
                    await fs.copyFile(sourceFile, targetFile);
                } else if (result.action === "rename") {
                    await this.copy(sourceFile, result.to);
                }
            } else {
                throw e;
            }
        }
    }
}

export type OnTargetAlreadyExistsAction =
    | { readonly action: "overwrite" | "skip" }
    | { readonly action: "rename"; readonly to: string };

export type FileCopyEventsHandler = {
    onTargetAlreadyExists?: (sourceFile: string, targetFile: string) => Promise<OnTargetAlreadyExistsAction>;
};
