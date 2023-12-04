import { program } from "commander";
import { downloadAllNewFiles } from "./actions/download";

program
    .command("init")
    .description("Initialize a global configuration")
    .action(async () => {
        // TODO: initialize configuration.
        throw new Error("Not implemented yet");
    });

program
    .description(
        `Download all new files from the specified removable drive (e.g. a memory card).
Relies on the global configuration to identify supported directories on the removable drive and to determine where their contents should be saved.`
    )
    // This removes `[command]` from the default no-name command usage sample to avoid the implication
    // that explicit commands (i.e. other than the default no-name command) require the `drive-path` argument.
    .usage("<drive-path>")
    .argument("<drive-path>", "Removable drive (e.g. memory card) path")
    .action(downloadAllNewFiles);

program.parse();
