/**
 * 
 * @param {string} pattern 
 * @param {number} bits 
 * @returns {boolean}
 */
function matchBitPattern(pattern, bits) {

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

/**
 * 
 * @param {number} bits 
 * @param {number} bitPos 
 * @returns {boolean}
 */
function getBit(bits, bitPos) {
    return ((bits >> bitPos) & 0x1) != 0;
}

/**
 * 
 * @param {number} bits 
 * @param {number} from 
 * @param {number} to 
 * @returns {number}
 */
function getBits(bits, from, to) {
    if (from == to) {
        return (bits >> to) & 0x1
    }
    bits <<= (31 - from);
    bits >>>= to + (31 - from);
    if (bits < 0) {
        bits *= -1;
    }
    return bits;
}

module.exports = {
    "matchBitPattern": matchBitPattern,
    "getBit": getBit,
    "getBits": getBits
};