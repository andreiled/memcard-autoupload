import { strict as assert } from "node:assert";

/**
 * @param array array that was already sorted in ascending order
 * @param min
 * @param start
 * @param endOpt
 * @returns index of the first array element that is larger than the provided `min`
 */
export function indexOfNextElement<Element>(
    array: readonly Element[],
    min: {
        /**
         * @param other
         * @returns -1, 0 or 1 if the argument is respectively less then, equal to or larger than `this` element
         */
        compareTo: (other: Element) => number;
    },
    start: number = 0,
    endOpt?: number
): number {
    const end = endOpt ?? array.length;
    assert(
        0 <= start && start < end && end <= array.length,
        `[${start}, ${end}) is not a valid interval with the array (length ${array.length})`
    );

    const middle = Math.floor((start + end) / 2);
    const middleElement = array[middle];
    const comparisonResult = min.compareTo(middleElement);
    if (comparisonResult >= 0) {
        // middleElement <= min: search to the right of the middle element
        return middle + 1 < end ? indexOfNextElement(array, min, middle + 1, end) : -1;
    } else {
        // middleElement > min: this middle element could be the answer, but need to check if there's a lesser suitable element to the left
        const closerToMinIndex = start < middle ? indexOfNextElement(array, min, start, middle) : -1;
        return closerToMinIndex == -1 ? middle : closerToMinIndex;
    }
}
