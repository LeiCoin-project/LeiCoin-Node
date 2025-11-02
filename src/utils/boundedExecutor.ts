/**
 * A utility class that executes asynchronous code with a timeout boundary.
 * 
 * This class wraps an async function and races it against a timeout. If the code
 * completes before the timeout, its result is returned. If the timeout expires first,
 * null is returned instead.
 * 
 * @template T - The type of the value returned by the async code when successful
 * 
 * @example
 * ```typescript
 * // Create an executor that times out after 5 seconds
 * const executor = new BoundedExecutor(
 *   async () => await fetchData(),
 *   5000
 * );
 * 
 * // Wait for either the result or timeout
 * const result = await executor.awaitResult();
 * if (result === null) {
 *   console.log('Operation timed out');
 * } else {
 *   console.log('Result:', result);
 * }
 * ```
 */
export class BoundedExecutor<T, ThisArg> implements Promise<T | null> {
    
    /** The promise that races between code execution and timeout */
    private promise: Promise<T | null>;

    /**
     * Creates a new BoundedExecutor and immediately starts the race between
     * code execution and the timeout.
     * 
     * @param code - The async function to execute with a time limit
     * @param timeout - The maximum time to wait in milliseconds before returning null
     */
    constructor(code: () => Promise<T>, timeout: number, thisArg?: ThisArg) {
        this.promise = Promise.race([
            BoundedExecutor.executeCode(code, thisArg),
            BoundedExecutor.createTimeoutPromise(timeout)
        ]);
    }

    /**
     * Waits for and returns the result of the bounded execution.
     * @deprecated Use just `await executor` instead.
     * @returns A promise that resolves to:
     *          - The result of type T if the code completes before the timeout
     *          - null if the timeout expires before the code completes
     */
    public awaitResult() {
        return this.promise;
    }

    public then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected);
    }

    public catch<TResult = never>(
        onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
    ): Promise<T | null | TResult> {
        return this.promise.catch(onrejected);
    }
    
    public finally(onfinally?: (() => void) | null | undefined): Promise<T | null> {
        return this.promise.finally(onfinally);
    }

    
    protected static executeCode<T, ThisArg>(code: () => Promise<T>, thisArg?: ThisArg): Promise<T> {
        if (thisArg !== undefined) {
            return code.call(thisArg);
        }
        return code();
    }

    protected static createTimeoutPromise(timeout: number) {
        return new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), timeout);
        });
    }

    public get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}
