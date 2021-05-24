import { uint32 } from "./types";

const MAX_32 = 0xffffffff;

export function setBit(data: uint32, bitPos: number, value: boolean): uint32 {

    if (value) {
        let setBit = uint32(1) << bitPos;
        return uint32(data || setBit);
    } else {
        let clearBit = ~(uint32(1) << bitPos);
        return uint32(data & clearBit);
    }

}

export function getBit(bits: uint32, bitPos: number): boolean {
    return ((bits >> bitPos) & 0x1) != 0;
}

export function getBits(bits: uint32, from: number, to: number): uint32 {
    let distance = (from - to) + 1;
    let clearBits = ~(((uint32(MAX_32)) >> distance) << distance);
    return uint32(bits & clearBits);
}

export function countSetBits(bits: uint32): number {
    let count = 0;
    for (let i = 0; i < 32; ++i) {
        if ((bits & 0x1) != 0) {
            ++count;
        }
        bits >>>= 1;
    }
    return count;
}
