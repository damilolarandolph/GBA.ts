
const MAX_32 = 0xffffffff;

export function setBit(data: u32, bitPos: u32, value: boolean): u32 {

    if (value) {
        let setBit = u32(1) << bitPos;
        return u32(data || setBit);
    } else {
        let clearBit = ~(u32(1) << bitPos);
        return u32(data & clearBit);
    }

}

export function getBit(bits: u32, bitPos: u32): boolean {
    return ((bits >> bitPos) & 0x1) != 0;
}

export function getBits(bits: u32, from: u32, to: u32): u32 {
    let distance = (from - to) + 1;
    let clearBits = ~(((u32(MAX_32)) >> distance) << distance);
    return u32(bits & clearBits);
}

export function countSetBits(bits: u32): u32 {
    let count = 0;
    for (let i = 0; i < 32; ++i) {
        if ((bits & 0x1) != 0) {
            ++count;
        }
        bits >>>= 1;
    }
    return count;
}

export function matchBitPattern(pattern: String, bits: u32): boolean {

    for (let index = pattern.length - 1; index > 0; --index) {

        if (pattern.charAt(index) == "1" && (bits & 0x1) == 0) {
            return false;
        }

        if (pattern.charAt(index) == "0" && (bits & 0x1) != 0) {
            return false;
        }
        bits >>>= 1;

    }

    return true;

}
