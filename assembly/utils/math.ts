import { getBit } from "./bits";


@inline
export function uAdd(lhs: u32, rhs: u32): u32 {
    if (getBit(rhs, 31)) {
        return lhs - ((~rhs) + 1);
    } else {
        return lhs + rhs;
    }
}