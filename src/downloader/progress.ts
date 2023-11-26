import { MultiBar, Presets, SingleBar } from "cli-progress";

export class ProgressTracker {
    private readonly multiBar: MultiBar;

    constructor() {
        this.multiBar = new MultiBar(
            {
                format: "[{sourceDir}] Downloading new files {bar} {percentage}% | {value}/{total} | Speed: {speed} | {summary}",
                barCompleteChar: "\u2588",
                barIncompleteChar: "\u2591",
                hideCursor: true,
            },
            Presets.shades_grey
        );
    }

    /**
     * Start tracking progress of copying a new batch of files.
     * @param sourceDir
     * @param total total number of new files in this batch
     * @returns new single-line progress bar
     */
    public startTracking(sourceDir: string, total: number): SingleDirBar {
        return new SingleDirBar(this.multiBar.create(total, 0, { sourceDir, speed: "N/A" }));
    }

    /**
     * Log a message above all progress bars.
     * @param message
     */
    public log(message: string) {
        this.multiBar.log(`${message}\n`);
    }

    public stop() {
        this.multiBar.stop();
    }
}

/**
 * Tracks the progress of copying a given batch of files.
 */
export class SingleDirBar {
    constructor(private readonly progressBar: SingleBar) {}

    /**
     * Set short summary of the current state of the overall operation progress
     * (shown to the right of the progress bar).
     * @param summary
     */
    public setStatusSummary(summary: string) {
        this.progressBar.increment(0, { summary });
    }

    public increment() {
        return this.progressBar.increment();
    }

    public stop() {
        this.progressBar.stop();
    }
}
