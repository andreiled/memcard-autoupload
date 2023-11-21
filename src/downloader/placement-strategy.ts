import * as fs from "node:fs/promises";
import path from "node:path";

export interface TargetPlacementStrategy {
    resolveTargetPath(sourcePath: string): Promise<string>;
}

export class GroupByDatePlacementStrategy implements TargetPlacementStrategy {
    public constructor(private readonly root: string) {}

    public async resolveTargetPath(sourcePath: string): Promise<string> {
        const modifiedAt = (await fs.stat(sourcePath)).mtime;
        const sourceFileName = path.basename(sourcePath);

        return `${this.root}/${this.formatDate(modifiedAt)}/${sourceFileName}`;
    }

    private formatDate(date: Date) {
        // TODO: support configuring the date format.
        return (
            `${date.getFullYear()}` +
            "-" +
            `${date.getMonth() + 1}`.padStart(2, "0") +
            "-" +
            `${date.getDate()}`.padStart(2, "0")
        );
    }
}
