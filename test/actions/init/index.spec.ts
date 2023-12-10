import prompts from "prompts";
import { initAutoDownloadConfiguration } from "../../../src/actions/init";
import { writeAutoDownloadConfiguration } from "../../../src/configuration/serializer";

jest.mock("prompts");
jest.mock("../../../src/configuration/serializer");

describe("initAutoDownloadConfiguration", () => {
    it("Should ask the user for target locations and write a new configuration", async () => {
        const mockPrompts = jest.mocked(prompts);
        mockPrompts.mockResolvedValueOnce({ ["targetRootDir"]: "/home/dauser/all-my-photos" });

        await initAutoDownloadConfiguration();

        expect(mockPrompts).toHaveBeenCalledTimes(1);

        {
            const promptArgs = mockPrompts.mock.calls[0];
            expect(promptArgs[0]).toHaveProperty("type", "text");
            expect(promptArgs[0]).toHaveProperty(
                "message",
                "Please specify the root directory where you want all photos to go."
            );
        }

        expect(jest.mocked(writeAutoDownloadConfiguration)).toHaveBeenCalledTimes(1);
        expect(jest.mocked(writeAutoDownloadConfiguration)).toHaveBeenCalledWith({
            DCIM: {
                target: {
                    root: "/home/dauser/all-my-photos",
                },
            },
        });
    });
});
