import prompts from "prompts";
import { writeAutoDownloadConfiguration } from "../../configuration/serializer";

export async function initAutoDownloadConfiguration() {
    const photosTargetRootDir = await promptTargetRootDirPath(
        "Please specify the root directory where you want all photos to go."
    );

    await writeAutoDownloadConfiguration({
        DCIM: {
            target: {
                root: photosTargetRootDir,
            },
        },
        // TODO: configuration for video files captured by Sony cameras.
    });
}

async function promptTargetRootDirPath(message: string) {
    return (
        await prompts({
            type: "text",
            name: "targetRootDir",
            message,
        })
    ).targetRootDir;
}
