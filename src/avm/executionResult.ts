
export enum TXExecResult {
    SUCCESS = 0x00,
    
    // @todo Define more specific failure reasons in the future

    FAILED_UNKNOWN = 0xFF
}

export const TXExecResultValues: ReadonlySet<TXExecResult> = new Set(Object.values(TXExecResult).filter(v => typeof v === 'number'));
