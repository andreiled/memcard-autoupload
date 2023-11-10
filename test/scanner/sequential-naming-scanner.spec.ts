import { expect } from "chai";

import { SequentialNamingScanner } from "../../src/scanner";

describe("SequentialNamingScanner", () => {
    const scanner = new SequentialNamingScanner({ ignoreDirs: ["test-ignore-dir"] });

    describe("findNewFiles", () => {
        describe("Given never processed directory with sub-directories containing files", () => {
            const sourceDir = `${__dirname}/.resources`;

            it("Should return all files in all directories except for the ignored directory", async () => {
                expect([...(await scanner.findNewFiles({ sourceDir }))])
                    .to.have.lengthOf(8)
                    .and.to.have.ordered.members([
                        ...range(1, 5).map((ind) => `DIR001/DP000${ind}.jpg`),
                        ...range(1, 3).map((ind) => `DIR002/DP000${ind}.jpg`),
                    ]);
            });
        });

        describe("Given first sub-directory was partially processed before", () => {
            const sourceDir = `${__dirname}/.resources`;

            it("Should return all new files form the first sub-directory and all files from the second sub-directory", async () => {
                expect([...(await scanner.findNewFiles({ sourceDir, lastProcessedFile: "DIR001/DP0003.jpg" }))])
                    .to.have.lengthOf(5)
                    .and.to.have.ordered.members([
                        ...range(4, 5).map((ind) => `DIR001/DP000${ind}.jpg`),
                        ...range(1, 3).map((ind) => `DIR002/DP000${ind}.jpg`),
                    ]);
            });
        });

        describe("Given first sub-directory was fully processed before", () => {
            const sourceDir = `${__dirname}/.resources`;

            it("Should return all files from the second sub-directory", async () => {
                expect([...(await scanner.findNewFiles({ sourceDir, lastProcessedFile: "DIR001/DP0005.jpg" }))])
                    .to.have.lengthOf(3)
                    .and.to.have.ordered.members(range(1, 3).map((ind) => `DIR002/DP000${ind}.jpg`));
            });
        });

        describe("Given last sub-directory was partially processed before", () => {
            const sourceDir = `${__dirname}/.resources`;

            it("Should return all new files from the last sub-directory", async () => {
                expect([...(await scanner.findNewFiles({ sourceDir, lastProcessedFile: "DIR002/DP0001.jpg" }))])
                    .to.have.lengthOf(2)
                    .and.to.have.ordered.members(range(2, 3).map((ind) => `DIR002/DP000${ind}.jpg`));
            });
        });

        describe("Given last sub-directory was fully processed before", () => {
            const sourceDir = `${__dirname}/.resources`;

            it("Should return no files", async () => {
                expect([
                    ...(await scanner.findNewFiles({ sourceDir, lastProcessedFile: "DIR002/DP0003.jpg" })),
                ]).to.have.lengthOf(0);
            });
        });
    });
});

function range(from: number, to: number) {
    return [...Array(to - from + 1).keys()].map((i) => from + i);
}
