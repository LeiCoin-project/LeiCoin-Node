
export enum TXExecResult {
    SUCCESS = 0x00,

    UNKNOWN_FAILURE = 0x01,
    INSUFFICIENT_FUNDS = 0x02,
    INVALID_SIGNATURE = 0x03,
    INVALID_NONCE = 0x04,
}

export const TXExecResultValues: ReadonlySet<TXExecResult> = new Set(Object.values(TXExecResult).filter(v => typeof v === 'number'));
