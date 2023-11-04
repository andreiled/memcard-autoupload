/**
 * If provided path is not already an array, the split provided path string to its path elements.
 *
 * Compared to functions provided by Node's `path` module, this implementation:
 * * surfaces each intermediate directory in the path as a separate path element
 * * makes no assumptions nor misrepresentations about the entry type (i.e. file vs directory)
 * * supports any mix of Windows and Unix path separators
 *   regardless of the default separator used by the actual runtime platform.
 *
 * @param path
 * @returns
 */
export function getPathElements(path: string | string[]): string[] {
    return typeof path === "string" ? path.split(/[/\\]/) : path;
}

/**
 * @param path
 * @param name path element name to compare with
 * @returns `true` if the first path element's name matches the specified name
 */
export function pathStartsWith(path: string[] | undefined, name: string) {
    return (path?.length ?? 0 > 0) && path![0] === name;
}
