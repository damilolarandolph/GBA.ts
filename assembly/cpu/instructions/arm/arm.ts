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
