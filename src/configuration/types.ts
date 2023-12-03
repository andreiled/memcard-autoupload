export interface DirectoryDownloadConfig {
    readonly target: {
        readonly root: string;
        // TODO: provide support to customize nested directory naming.
    };
}

export interface DriveDownloadConfiguration {
    readonly [sourceDir: string]: DirectoryDownloadConfig;
}
