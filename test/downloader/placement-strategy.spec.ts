import { Stats } from "node:fs";
import * as fs from "node:fs/promises";
import { GroupByDatePlacementStrategy } from "../../src/downloader/placement-strategy";

jest.mock("node:fs/promises");

describe("GroupByDatePlacementStrategy", () => {
    const strategy = new GroupByDatePlacementStrategy("/tmp/dummy-root-dir");

    function composeTestCase(modifiedAt: Date, expectedTargetFilePath: string) {
        describe(`Given file last modified at ${modifiedAt}`, () => {
            const sourceFilePath = "/tmp/dummy-source/test-file-a.txt";

            it(`Expect ${expectedTargetFilePath}`, async () => {
                jest.mocked(fs.stat).mockResolvedValue({ mtime: modifiedAt } as Stats);

                const actual = await strategy.resolveTargetPath(sourceFilePath);

                expect(actual).toStrictEqual(expectedTargetFilePath);

                expect(fs.stat).toHaveBeenCalledTimes(1);
                expect(fs.stat).toHaveBeenCalledWith(sourceFilePath);
            });
        });
    }

    composeTestCase(new Date(2020, 5 /*June*/, 17), "/tmp/dummy-root-dir/2020-06-17/test-file-a.txt");
    composeTestCase(new Date(2020, 5 /*June*/, 17, 23, 59), "/tmp/dummy-root-dir/2020-06-17/test-file-a.txt");

    composeTestCase(new Date(2020, 9 /*Oct*/, 17), "/tmp/dummy-root-dir/2020-10-17/test-file-a.txt");
    composeTestCase(new Date(2020, 9 /*Oct*/, 17, 23, 47, 34), "/tmp/dummy-root-dir/2020-10-17/test-file-a.txt");

    composeTestCase(new Date(1985, 9 /*Oct*/, 17), "/tmp/dummy-root-dir/1985-10-17/test-file-a.txt");
    composeTestCase(new Date(2045, 9 /*Oct*/, 17), "/tmp/dummy-root-dir/2045-10-17/test-file-a.txt");
});
