import { strict as assert } from "node:assert";
import * as fs from "node:fs/promises";
import path from "node:path";

export interface SequentialNamingCursorPosition {
    /**
     * Last file processed during the latest completed processing session.
     */
    readonly lastProcessedFile?: string;
}

export interface CursorPosition {
    readonly sequential?: SequentialNamingCursorPosition;
}

const CURSOR_FILE = ".auto-download/cursor.json";

/**
 * @param dir directory path
 * @returns latest saved cursor position for the specified directory or `undefined` if the specified directory
 * was never processed before and does not contain a saved cursor position.
 */
export async function readDirectoryCursor(dir: string): Promise<CursorPosition | undefined> {
    try {
        return JSON.parse((await fs.readFile(`${dir}/${CURSOR_FILE}`, { encoding: "utf8" })).toString());
    } catch (error: any) {
        if (error?.code === "ENOENT") {
            return undefined;
        } else {
            throw error;
        }
    }
}

export async function saveDirectoryCursor(dir: string, cursor: CursorPosition) {
    assert(cursor.sequential, "Cursor type must be defined");

    const cursorFile = `${dir}/${CURSOR_FILE}`;
    await fs.mkdir(path.dirname(cursorFile), { recursive: true });
    await fs.writeFile(cursorFile, JSON.stringify(cursor), { encoding: "utf8" });
}
