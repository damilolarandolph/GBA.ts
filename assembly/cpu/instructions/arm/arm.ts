import { matchBitPattern } from '../../../utils/bits';

export * from './address-modes';
export * from './alu';
export * from './branch';
export * from './load-store';
export * from './misc';
export * from './multiply';


export function isDataProcessingOrPSR(miniOpMSB: u8, miniOpLSB: u8): bool {
    let result = matchBitPattern("00xxxxxx", miniOpMSB);
    let isImmediate = ((miniOpMSB >>> 5) & 0x1) != 0;
    if (isImmediate && (miniOpMSB & 0x1) != 0)
        return false;
    if (!isImmediate && (miniOpLSB & 0x8) != 0)
        return false;
    return result;
}

export function isMultiply(miniOpMSB: u8, miniOpLSB: u8): bool {
    return matchBitPattern("000000xx", miniOpMSB) && matchBitPattern("1001", miniOpLSB);
}

export function isMultiplyLong(miniOpMSB: u8, miniOpLSB: u8): bool {
    return matchBitPattern("00001xxx", miniOpMSB) && matchBitPattern("1001", miniOpLSB);
}

export function isSingleDataSwap(miniOpMSB: u8, miniOpLSB: u8): bool {
    return matchBitPattern("00010x00", miniOpMSB) && matchBitPattern("1001", miniOpLSB);
}

export function isBranchExchange(miniOpMSB: u8, miniOpLSB: u8): bool {
    return matchBitPattern("00010010", miniOpMSB) && matchBitPattern("0001", miniOpLSB);
}

export function isHalfwordDataTransferRegOff(miniOpMSB: u8, miniOpLSB: u8): bool {
    let match = matchBitPattern("000xx0xx", miniOpMSB) && matchBitPattern("1xx1", miniOpLSB);
    return match;
}

export function isHalfwordDataTransferImmediateOff(miniOpMSB: u8, miniOpLSB: u8): bool {
    return matchBitPattern("000xx1xx", miniOpMSB) && matchBitPattern("1xx1", miniOpLSB);
}

export function isSingleDataTransfer(miniOpMSB: u8, _miniOpLSB: u8): bool {
    return matchBitPattern("01xxxxxx", miniOpMSB);
}

export function undefined(miniOpMSB: u8, miniOpLSB: u8): bool {
    return matchBitPattern("011xxxxx", miniOpMSB) && matchBitPattern("xxx1", miniOpLSB);
}

export function isBlockDataTransfer(miniOpMSB: u8, _miniOpLSB: u8): bool {
    return matchBitPattern("100xxxxx", miniOpMSB);
}

export function isBranch(miniOpMSB: u8, _miniOpLSB: u8): bool {
    return matchBitPattern("101xxxxx", miniOpMSB);
}

export function isSoftwareInterrupt(miniOpMSB: u8, _miniOpLSB: u8): bool {
    return matchBitPattern("11111111", miniOpMSB);
}
