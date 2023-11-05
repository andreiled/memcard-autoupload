import { expect } from "chai";
import * as fs from "node:fs/promises";
import * as os from "node:os";

import { readDirectoryCursor, saveDirectoryCursor } from "../../src/source-cursor";

describe("readDirectoryCursor", () => {
    describe("Given cursor file exists", () => {
        const dir = `${__dirname}/.resources/cursor-exists`;

        it("Expect saved cursor position", async () => {
            expect(await readDirectoryCursor(dir)).to.be.deep.equal({
                sequential: {
                    lastProcessedFile: "DIR002/IMG04367.JPG",
                },
            });
        });
    });

    describe("Given cursor file does not exist", () => {
        const dir = `${__dirname}/.resources/cursor-does-not-exist`;

        it("Expect undefined", async () => {
            expect(await readDirectoryCursor(dir)).to.be.undefined;
        });
    });
});

describe("saveDirectoryCursor", () => {
    describe("Given valid cursor position", () => {
        it("Should create new cursor file", async () => {
            const dir = await fs.mkdtemp(`${os.tmpdir()}/source-cursor-spec-`);

            await saveDirectoryCursor(dir, { sequential: { lastProcessedFile: "DOR003/IMG28501.JPG" } });

            expect(
                (await fs.readFile(`${dir}/.auto-download/cursor.json`, { encoding: "utf8" })).toString()
            ).to.be.equal('{"sequential":{"lastProcessedFile":"DOR003/IMG28501.JPG"}}');
        });
    });
});
