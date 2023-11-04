export const StringUtils = {
    /**
     * Compared to `string.localeCompare`, this function obeys the **true** lexicographic order based on characters codes.
     * For example, any capital letter is considered less than any lower case letter.
     * @param a
     * @param b
     * @returns -1, 0 or 1 if `a` is less then `b`, equal to `b` or greater than `b` respectively
     */
    compare: (a: string, b: string): number => {
        return a < b ? -1 : a > b ? 1 : 0;
    },
} as const;
