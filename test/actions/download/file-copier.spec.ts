import * as fs from "node:fs/promises";
import * as os from "node:os";
import { FileCopier } from "../../../src/actions/download/file-copier";

jest.mock("node:fs/promises");

const realFs: typeof fs = jest.requireActual("node:fs/promises");

describe("FileCopier", () => {
    describe("Given a single file to copy", () => {
        const sourceFile = `${__dirname}/.resources/dummy-drive-2/DCIM/IMG001.ARW`;

        async function createTestTarget() {
            const targetRoot = await realFs.mkdtemp(`${os.tmpdir()}/dummy-target-`);

            const targetFileDir = `${targetRoot}/subdir01`;
            const targetFile = `${targetFileDir}/IMG001.ARW`;

            return { targetRoot, targetFileDir, targetFile };
        }

        function replaceFsMocksWithSpies() {
            const mkdir = jest.mocked(fs.mkdir);
            mkdir.mockImplementation(realFs.mkdir);
            const copyFile = jest.mocked(fs.copyFile);
            copyFile.mockImplementation(realFs.copyFile);

            return { mkdir, copyFile };
        }

        describe("And the target directory does not exist", () => {
            it("Should create the target directory and copy the file", async () => {
                const { mkdir, copyFile } = replaceFsMocksWithSpies();

                const { targetFileDir, targetFile } = await createTestTarget();

                const copier = new FileCopier();

                await copier.copy(sourceFile, targetFile);

                expect(mkdir).toHaveBeenCalledWith(targetFileDir, { recursive: true });
                expect(copyFile).toHaveBeenCalledWith(sourceFile, targetFile, fs.constants.COPYFILE_EXCL);
            });
        });

        describe("And the target directory already exists", () => {
            describe("When attempting to create the target directory", () => {
                it("Should not fail", async () => {
                    const { mkdir, copyFile } = replaceFsMocksWithSpies();

                    const { targetFileDir, targetFile } = await createTestTarget();
                    await realFs.mkdir(targetFileDir);

                    const copier = new FileCopier();

                    await copier.copy(sourceFile, targetFile);

                    // Verify that `FileCopier` attempted to create the directory anyway.
                    expect(mkdir).toHaveBeenCalledWith(targetFileDir, { recursive: true });
                    expect(copyFile).toHaveBeenCalledWith(sourceFile, targetFile, fs.constants.COPYFILE_EXCL);
                });
            });
        });

        describe("And the target file already exists", () => {
            describe("And copy events handler is not provided", () => {
                it("Should refuse", async () => {
                    const { copyFile } = replaceFsMocksWithSpies();

                    const copier = new FileCopier();

                    const { targetFileDir, targetFile } = await createTestTarget();
                    await realFs.mkdir(targetFileDir);
                    await realFs.writeFile(targetFile, "Original test file content");

                    await expect(() => copier.copy(sourceFile, targetFile)).rejects.toThrow(/.?file already exists.?/);

                    expect(copyFile).toHaveBeenCalledWith(sourceFile, targetFile, fs.constants.COPYFILE_EXCL);
                    // Verify that the file was not corrupted despite making the `fs.copyFile` unconditionally.
                    expect(await realFs.readFile(targetFile, { encoding: "utf8" })).toStrictEqual(
                        "Original test file content"
                    );
                });
            });
        });
    });

    describe("Given multiple requests to copy files", () => {
        it("Should create each target directory once", async () => {
            const mockMkdir = jest.mocked(fs.mkdir);

            const copier = new FileCopier();

            await copier.copy("/tmp/dummy-file-1", "/tmp/dummy-target/dir01/file01");
            await copier.copy("/tmp/dummy-file-2", "/tmp/dummy-target/dir01/file02");
            await copier.copy("/tmp/dummy-file-3", "/tmp/dummy-target/dir01/file03");

            expect(mockMkdir.mock.calls).toStrictEqual([["/tmp/dummy-target/dir01", { recursive: true }]]);

            await copier.copy("/tmp/dummy-file-4", "/tmp/dummy-target/dir02/file04");

            expect(mockMkdir.mock.calls).toStrictEqual([
                ["/tmp/dummy-target/dir01", { recursive: true }],
                ["/tmp/dummy-target/dir02", { recursive: true }],
            ]);

            await copier.copy("/tmp/dummy-file-5", "/tmp/dummy-target/dir03/file05");
            await copier.copy("/tmp/dummy-file-6", "/tmp/dummy-target/dir03/file06");

            expect(mockMkdir.mock.calls).toStrictEqual([
                ["/tmp/dummy-target/dir01", { recursive: true }],
                ["/tmp/dummy-target/dir02", { recursive: true }],
                ["/tmp/dummy-target/dir03", { recursive: true }],
            ]);
        });
    });
});
