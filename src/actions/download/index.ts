// Note: consilder all sub-modules to be 'private' to this module and do not re-export any of them here.
import { Downloader } from "./downloader";

export async function downloadAllNewFiles(drivePath: string) {
    await new Downloader().downloadAllNewFiles(drivePath);
}
