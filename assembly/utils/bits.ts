
const MAX_32: u32 = 0xffffffff;

export function setBit(data: u32, bitPos: u32, value: boolean): u32 {

    let shiftedBits = data >>> bitPos;
    let restorationBits = data << (32 - bitPos);
    restorationBits = restorationBits >>> (32 - bitPos);

    if (value) {
        shiftedBits = shiftedBits | 0x1;
    } else {
        shiftedBits = shiftedBits >>> 1;
        shiftedBits = shiftedBits << 1;
    }

    shiftedBits = shiftedBits << bitPos;
    shiftedBits = shiftedBits | restorationBits;
    return shiftedBits;

}

@inline
export function getBit(bits: u32, bitPos: u32): boolean {
    return ((bits >> bitPos) & 0x1) != 0;
}

@inline
export function getBits(bits: u32, from: u32, to: u32): u32 {
    if (from == to) {
        return (bits >> to) & 0x1
    }
    bits <<= (31 - from);
    bits >>= to + (31 - from);
    return bits;
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


@inline
export function signExtend(bits: u32, size: u32): u32 {
    let offset = 32 - size;
    bits <<= offset;
    bits = u32(<i32>bits >> offset);
    return bits;
}

export function matchBitPattern(pattern: String, bits: u32): bool {

    for (let index = pattern.length - 1; index >= 0; --index) {

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
