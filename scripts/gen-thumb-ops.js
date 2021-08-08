const fs = require('fs');
const path = require('path');
const { matchBitPattern, getBit, getBits } = require('./utils');


/**
 * @callback MatcherFunc
 * @param {number} row
 * @param {number} col
 * @param {number} fullInstruction
 * @returns {string|false} 
 */



/** @type {MatcherFunc[]} */
let matchers = []


// Move shifted register
/** @type {MatcherFunc} */
function THUMB_1(row, col, fullInstruction) {

    if (!matchBitPattern('000x', row)) {
        return false;
    }

    let opcode = getBits(fullInstruction, 12, 11);

    switch (opcode) {
        case 0b00:
            return ' t.LSL'
        case 0b01:
            return ' t.LSR'
        case 0b10:
            return ' t.ASR'
    }

    return false;

}

matchers.push(THUMB_1);

// ADD/SUBTRACT
/** @type {MatcherFunc} */
function THUMB_2(row, col, fullInstruction) {
    if (!matchBitPattern('0001', row) || !matchBitPattern('1xxxxx', col)) {
        return false;
    }

    let op = getBit(fullInstruction, 9);

    if (op) {
        return ' t.SUB'
    } else {
        return ' t.ADD'
    }
}

matchers.push(THUMB_2);

// Format 3: move/compare/add/subtract immediate
/** @type {MatcherFunc} */
function THUMB_3(row, col, fullInstruction) {
    if (!matchBitPattern('001x', row)) {
        return false;
    }

    let op = getBits(fullInstruction, 12, 11);

    switch (op) {
        case 0b00:
            return ' t.MOV';
        case 0b01:
            return ' t.CMP';
        case 0b10:
            return ' t.ADD';
        case 0b11:
            return ' t.SUB'
    }

    return false;
}

matchers.push(THUMB_3);

//Format 4: ALU operations
/** @type {MatcherFunc} */
function THUMB_4(row, col, fullInstruction) {
    if (!matchBitPattern('0100', row) || !matchBitPattern('00xxxx', col)) {
        return false;
    }

    let op = getBits(fullInstruction, 9, 6);

    switch (op) {
        case 0b0000:
            return ' t.AND';
        case 0b0001:
            return ' t.EOR';
        case 0b0010:
            return ' t.LSL';
        case 0b0011:
            return ' t.LSR';
        case 0b0100:
            return ' t.ASR';
        case 0b0101:
            return ' t.ADC';
        case 0b0110:
            return ' t.SBC';
        case 0b0111:
            return ' t.ROR';
        case 0b1000:
            return ' t.TST';
        case 0b1001:
            return ' t.NEG';
        case 0b1010:
            return ' t.CMP';
        case 0b1011:
            return ' t.CMN';
        case 0b1100:
            return ' t.ORR';
        case 0b1101:
            return ' t.MUL';
        case 0b1110:
            return ' t.BIC';
        case 0b1111:
            return ' t.MVN';
    }

    return false;
}

matchers.push(THUMB_4);

// Format 5: Hi register operations/branch exchange
/** @type {MatcherFunc} */
function THUMB_5(row, col, fullInstruction) {
    if (!matchBitPattern('0100', row) || !matchBitPattern('01xxxx', col)) {
        return false;
    }

    let op = getBits(fullInstruction, 9, 8);

    switch (op) {
        case 0b00:
            return ' t.ADD';
        case 0b01:
            return ' t.CMP';
        case 0b10:
            return ' t.MOV';
        case 0b11:
            return ' t.BX';
    }

    return false;
}

matchers.push(THUMB_5);

// Format 6: PC-relative load
/** @type {MatcherFunc} */
function THUMB_6(row, col, fullInstruction) {
    if (!matchBitPattern('0100', row) || !matchBitPattern('1xxxxx', col)) {
        return false;
    }

    return ' t.LDR';
}

matchers.push(THUMB_6);

// Format 7: load/store with register offset
/** @type {MatcherFunc} */
function THUMB_7(row, col, fullInstruction) {
    if (!matchBitPattern('0101', row) || !matchBitPattern('xx0xxx', col)) {
        return false;
    }

    let isLoad = getBit(fullInstruction, 11);
    let isByte = getBit(fullInstruction, 10);

    if (isLoad && !isByte) {
        return ' t.LDR';
    }

    if (isLoad && isByte) {
        return ' t.LDRB'
    }

    if (!isLoad && !isByte) {
        return ' t.STR';
    }

    return ' t.STRB';
}

matchers.push(THUMB_7);

// Format 8: load/store sign-extended byte/halfword
/** @type {MatcherFunc} */
function THUMB_8(row, col, fullInstruction) {
    if (!matchBitPattern('0101', row) || !matchBitPattern('xx1xxx', col)) {
        return false;
    }

    let sBit = getBit(fullInstruction, 10);
    let hBit = getBit(fullInstruction, 11);

    if (!sBit && !hBit) {
        return ' t.STRH';
    }

    if (!sBit && hBit) {
        return ' t.LDRH';
    }

    if (sBit && !hBit) {
        return ' t.LDRSB';
    }

    return ' t.LDRSH';
}

matchers.push(THUMB_8);

// Format 9: load/store with immediate offset
/** @type {MatcherFunc} */
function THUMB_9(row, col, fullInstruction) {
    if (!matchBitPattern('011x', row)) {
        return false;
    }

    let lBit = getBit(fullInstruction, 11);
    let bBit = getBit(fullInstruction, 12);

    if (!lBit && !bBit) {
        return ' t.STR'
    }

    if (lBit && !bBit) {
        return ' t.LDR'
    }

    if (!lBit && bBit) {
        return ' t.STRB';
    }

    return ' t.LDRB';
}

matchers.push(THUMB_9);


// Format 10: load/store halfword
/** @type {MatcherFunc} */
function THUMB_10(row, col, fullInstruction) {
    if (!matchBitPattern('1000', row)) {
        return false;
    }

    if (getBit(fullInstruction, 11)) {
        return ' t.LDRH';
    } else {
        return ' t.STRH';
    }
}
matchers.push(THUMB_10);


// Format 11: SP-relative load/store
/** @type {MatcherFunc} */
function THUMB_11(row, col, fullInstruction) {
    if (!matchBitPattern('1001', row)) {
        return false;
    }

    if (getBit(fullInstruction, 11)) {
        return ' t.LDR';
    } else {
        return ' t.STR';
    }
}
matchers.push(THUMB_11);


// Format 12: load address
/** @type {MatcherFunc} */
function THUMB_12(row, col, fullInstruction) {
    if (!matchBitPattern('1010', row)) {
        return false;
    }

    return ' t.ADD';
}
matchers.push(THUMB_12);

// Format 13: add offset to Stack Pointer
/** @type {MatcherFunc} */
function THUMB_13(row, col, fullInstruction) {
    if (!matchBitPattern('1011', row) || !matchBitPattern('0000xx', col)) {
        return false;
    }

    return ' t.ADD';
}
matchers.push(THUMB_13);

// Format 14: push/pop registers
/** @type {MatcherFunc} */
function THUMB_14(row, col, fullInstruction) {
    if (!matchBitPattern('1011', row) || !matchBitPattern('x10xxx', col)) {
        return false;
    }

    let lBit = getBit(fullInstruction, 11);
    let rBit = getBit(fullInstruction, 8);

    if (!lBit && !rBit) {
        return ' t.PUSH';
    }

    if (!lBit && rBit) {
        return ' t.PUSH';
    }

    if (lBit && !rBit) {
        return ' t.POP';
    }

    return ' t.POP';
}

matchers.push(THUMB_14);

// Format 15: multiple load/store
/** @type {MatcherFunc} */
function THUMB_15(row, col, fullInstruction) {
    if (!matchBitPattern('1100', row)) {
        return false;
    }

    if (getBit(fullInstruction, 11)) {
        return ' t.LDMIA'
    } else {
        return ' t.STMIA'
    }
}
matchers.push(THUMB_15);

// Format 16: conditional branch
/** @type {MatcherFunc} */
function THUMB_16(row, col, fullInstruction) {
    if (!matchBitPattern('1101', row)) {
        return false;
    }

    return ' t.BC';
}
matchers.push(THUMB_16);

// Format 17: software interrupt
/** @type {MatcherFunc} */
function THUMB_17(row, col, fullInstruction) {
    if (!matchBitPattern('1101', row) || !matchBitPattern('1111xx', col)) {
        return false;
    }

    return ' t.SWI';
}
matchers.push(THUMB_17);

// Format 18: unconditional branch
/** @type {MatcherFunc} */
function THUMB_18(row, col, fullInstruction) {
    if (!matchBitPattern('1110', row) || !matchBitPattern('0xxxxx', col)) {
        return false;
    }

    return ' t.B';
}

matchers.push(THUMB_18);

// Format 19: long branch with link
/** @type {MatcherFunc} */
function THUMB_19(row, col, fullInstruction) {
    if (!matchBitPattern('1111', row)) {
        return false;
    }

    return ' t.BLBLX';
}
matchers.push(THUMB_19);

// Generator Logic

let file = `
import { ARM7CPU } from '../cpu';
import * as t from './thumb/thumb';

export type opHandler = (cpu: ARM7CPU) => void;

export const thumbOpTable:  StaticArray<StaticArray<opHandler | null>> = [



`;

for (let row = 0; row < 16; ++row) {
    let arrayCol = `/** 0x${row.toString(16)} **/[`;
    for (let col = 0; col < 64; ++col) {

        let fullInstruction = (row << 12) | (col << 6);
        let op;
        matchers.some(func => {
            op = func(row, col, fullInstruction)
            return op;
        });

        arrayCol += op ? op : ' null';
        if (col != 63)
            arrayCol += ',';
    }

    arrayCol += "]";
    if (row != 15)
        arrayCol += ",";
    file += ("\n" + arrayCol)
}

file += ('\n' + ']')

let filePath = path.resolve(__dirname, "../assembly/cpu/instructions", "thumb-op-table.ts");

fs.writeFileSync(filePath, file, { flag: 'w' });

