import { getBit, getBits, matchBitPattern } from '../../../utils/bits';

export * from './address-modes';
export * from './alu';
export * from './branch';
export * from './load-store';
export * from './misc';
export * from './multiply';


export function isDataProcessingOrPSR(miniOpMSB: u8, miniOpLSB: u8): bool {
    let result = matchBitPattern("00xxxxxx", miniOpMSB);
    if (!result)
        return false;
    let fullInstruction: u32 = (u32(miniOpMSB) << 20) | (u32(miniOpLSB) << 4);
    let opcode = getBits(fullInstruction, 24, 21);
    let sConds = getBit(fullInstruction, 20);
    let iBit = getBit(fullInstruction, 25);
    let rBit = getBit(fullInstruction, 4);
    let shiftType = getBits(fullInstruction, 6, 5);
    if (opcode > 0xf)
        return false;

    if (!sConds && (opcode >= 0x8 && opcode <= 0xb))
        return false;

    if (!iBit && rBit && getBit(fullInstruction, 4))
        return false;

    if (!iBit && (shiftType < 0 || shiftType > 3)) {
        return false;
    }


    return result;
}

export function isPSR(miniOpMSB: u8, miniOpLSB: u8): bool {
    return matchBitPattern("00010xx0", miniOpMSB) && matchBitPattern("0000", miniOpLSB);
}

export function isPSRImm(miniOpMSB: u8, miniOpLSB: u8): bool {
    let res = matchBitPattern("00x10x10", miniOpMSB);
    if (!res) {
        return false;
    }

    let fullInstruction: u32 = (u32(miniOpMSB) << 20) | (u32(miniOpLSB) << 4);
    let iBit = getBit(fullInstruction, 25);
    if (!iBit && getBits(fullInstruction, 7, 4) != 0) {
        return false;
    }

    return true;
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
