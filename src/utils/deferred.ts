
export class Deferred<T = void> implements Promise<T> {

    protected _resolve: ((value: any) => void) | null = null;
    protected _reject: ((reason?: any) => void) | null = null;

    protected readonly promise: Promise<T>;
    protected resolved = false;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    protected cleanup() {
        this._resolve = null;
        this._reject = null;
    }

    public resolve(value: T | PromiseLike<T>) {
        if (!this._resolve) return this.promise;

        this._resolve(value);
        this.resolved = true;
        this.cleanup();

        return this.promise;
    }

    public reject(reason?: any) {
        if (!this._reject) return this.promise;

        this._reject(reason);
        this.resolved = true;
        this.cleanup();

        return this.promise;
    }

    /**
     * Wait for the deferred to be resolved.
     * @deprecated Use just `await deferred` instead.
     * @returns 
     */
    public awaitResult() {
        return this.promise;
    }

    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected);
    }

    catch<TResult = never>(
        onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
    ): Promise<T | TResult> {
        return this.promise.catch(onrejected);
    }
    
    finally(onfinally?: (() => void) | null | undefined): Promise<T> {
        return this.promise.finally(onfinally);
    }

    public hasResolved() {
        return this.resolved;
    }

}