import { Uint } from "low-level";

export class QuickSort {

    private static deepSort<T>(arr: T[], leftPos: number, rightPos: number, arrLength: number, compareFunc: QuickSort.CompareFunc<T>) {
        
        let initialLeftPos = leftPos;
        let initialRightPos = rightPos;
        let direction = true;
        let pivot = rightPos;

        while ((leftPos - rightPos) < 0) {

            if (direction) {
                if (compareFunc(arr[pivot] as T, arr[leftPos] as T) < 0) {
                    QuickSort.swap(arr, pivot, leftPos);
                    pivot = leftPos;
                    rightPos--;
                    direction = !direction;
                } else {
                    leftPos++;
                }
            } else {
                if (compareFunc(arr[pivot] as T, arr[rightPos] as T) <= 0) {
                    rightPos--;
                } else {
                    QuickSort.swap(arr, pivot, rightPos);
                    leftPos++;
                    pivot = rightPos;
                    direction = !direction;
                }
            }

        }
        if (pivot - 1 > initialLeftPos) {
            QuickSort.deepSort(arr, initialLeftPos, pivot - 1, arrLength, compareFunc);
        }
        if (pivot + 1 < initialRightPos) {
            QuickSort.deepSort(arr, pivot + 1, initialRightPos, arrLength, compareFunc);
        }

    }

    private static swap<T>(arr: T[], el1: number, el2: number) {
        let swapedElem = arr[el1] as T
        arr[el1] = arr[el2] as T;
        arr[el2] = swapedElem;
    }

    static sort<T>(arr: T[], compareFunc: QuickSort.CompareFunc<T>, clone?: false): void;
    static sort<T>(arr: T[], compareFunc: QuickSort.CompareFunc<T>, clone: true): T[];
    static sort<T>(arr: T[], compareFunc: QuickSort.CompareFunc<T>, clone: boolean): T[] | void;
    static sort<T>(arr: T[], compareFunc: QuickSort.CompareFunc<T>, clone = false) {        
        if (clone) {
            const sortedArr = arr.slice();
            this.deepSort(sortedArr, 0, arr.length - 1, arr.length, compareFunc);
            return sortedArr;
        }
        return this.deepSort(arr, 0, arr.length - 1, arr.length, compareFunc);
    }

    static isSorted<T>(arr: T[], compareFunc: QuickSort.CompareFunc<T>) {
        for (let i = 0; i < arr.length - 1; i++) {
            if (compareFunc(arr[i] as T, arr[i + 1] as T) > 0) {
                return false;
            }
        }
        return true;
    }

}

class SortFN<T> {

    constructor(
        protected readonly compareFunc: QuickSort.CompareFunc<T>
    ) {}

    public sort(arr: T[], clone?: false): void;
    public sort(arr: T[], clone: true): T[];
    public sort(arr: T[], clone: boolean): T[] | void;
    public sort(arr: T[], clone = false) {
        return QuickSort.sort(arr, this.compareFunc, clone);
    }

    public isSorted(arr: T[]) {
        return QuickSort.isSorted(arr, this.compareFunc);
    }

}

export namespace QuickSort {
    export type CompareFunc<T> = (base: T, compare: T) => -1 | 0 | 1;

    export const NumArray = new SortFN<number>((base, compare) => {
        if (base < compare) return -1;
        if (base > compare) return 1;
        return 0;
    });

    export const UintArray = new SortFN<Uint>((base, compare) => {
        return Buffer.compare(base.getRaw(), compare.getRaw());
    });
}
