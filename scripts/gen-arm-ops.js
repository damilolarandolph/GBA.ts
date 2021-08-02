const fs = require('fs');
const path = require('path');
const { matchBitPattern, getBit, getBits } = require('./utils.js');



/**
 * @callback MatcherFunc
 * @param {number} row
 * @param {number} col
 * @param {number} fullInstruction
 * @returns {string|false} 
 */



/** @type {MatcherFunc[]} */
let matchers = []


function aluOpSwitch(aluOpcode) {
    switch (aluOpcode) {
        case 0x0:
            return " arm.AND"
        case 0x1:
            return " arm.EOR"
        case 0x2:
            return ' arm.SUB'
        case 0x3:
            return ' arm.RSB'
        case 0x4:
            return ' arm.ADD'
        case 0x5:
            return ' arm.ADDC'
        case 0x6:
            return ' arm.SBC'
        case 0x7:
            return ' arm.RSC'
        case 0x8:
            return ' arm.TST'
        case 0x9:
            return ' arm.TEQ'
        case 0xa:
            return ' arm.CMP'
        case 0xb:
            return ' arm.CMN'
        case 0xc:
            return ' arm.ORR'
        case 0xd:
            return ' arm.MOV'
        case 0xe:
            return ' arm.BIC'
        case 0xf:
            return ' arm.MVN'
        default:
            return false;
    }
}

/** @type {MatcherFunc} */
function testDataProcImmShift(row, col, fullInstruction) {
    if (!matchBitPattern("000xxxxx", row) || !matchBitPattern("xxx0", col)) {
        return false;
    }
    let aluOpcode = getBits(fullInstruction, 24, 21);
    let sBit = getBit(fullInstruction, 20);
    if (!sBit && aluOpcode >= 0x8 && aluOpcode <= 0xb) {
        return false;
    }

    return aluOpSwitch(aluOpcode);
}

matchers.push(testDataProcImmShift);



function test_STATUS_TO_REG(row, col, fullInstruction) {
    if (!matchBitPattern("00010x00", row) || !matchBitPattern("0000", col)) {
        return false;
    }
    return 'arm.MRS';
}

matchers.push(test_STATUS_TO_REG);



function test_REG_TO_STATUS(row, col, fullInstruction) {
    if (!matchBitPattern("00010x10", row) || !matchBitPattern("0000", col)) {
        return false;
    }
    return 'arm.MSR';
}

matchers.push(test_REG_TO_STATUS);



function test_DATA_REG_SHIFT(row, col, fullInstruction) {
    if (!matchBitPattern("000xxxxx", row) || !matchBitPattern("0xx1", col)) {
        return false;
    }
    let aluOpcode = getBits(fullInstruction, 24, 21);
    let sBit = getBit(fullInstruction, 20);
    if (!sBit && aluOpcode >= 0x8 && aluOpcode <= 0xb) {
        return false;
    }

    return aluOpSwitch(aluOpcode);
}

matchers.push(test_DATA_REG_SHIFT);


function test_BRANCH_EXCHANGE(row, col, fullInstruction) {
    if (!matchBitPattern("00010010", row) || !matchBitPattern("0001", col)) {
        return false;
    }

    return ' arm.BX';
}

matchers.push(test_BRANCH_EXCHANGE);

/** @type {MatcherFunc} */
function testMultiply(row, col, fullInstruction) {
    if (!matchBitPattern("000000xx", row) || !matchBitPattern("1001", col)) {
        return false;
    }
    if (getBit(fullInstruction, 21)) {
        return ' arm.MLA'
    } else {
        return ' arm.MUL'
    }
}

matchers.push(testMultiply)

/** @type{MatcherFunc} */
function testMultiplyLong(row, col, fullInstruction) {
    if (!matchBitPattern("00001xxx", row) || !matchBitPattern("1001", col)) {
        return false;
    }
    let uBit = getBit(fullInstruction, 22);
    let aBit = getBit(fullInstruction, 21);
    if (aBit) {
        if (uBit) {
            return ' arm.SMLAL';
        }
        else {
            return ' arm.UMLAL';
        }
    }
    else {
        if (uBit) {
            return ' arm.SMLUL';
        }
        else {
            return ' arm.UMULL';
        }
    }
}

matchers.push(testMultiplyLong)

function testSwapByte(row, col, fullInstruction) {
    if (!matchBitPattern("00010x00", row) || !matchBitPattern("1001", col)) {
        return false;
    }
    if (getBit(fullInstruction, 22)) {
        return ' arm.SWPB';
    } else {
        return ' arm.SWP';
    }
}

matchers.push(testSwapByte);

function testLoadStoreHalfwordReg(row, col, fullInstruction) {
    if (!matchBitPattern("000xx0xx", row) || !matchBitPattern("1011", col)) {
        return false;
    }
    let lbit = getBit(fullInstruction, 20);
    let type = getBits(fullInstruction, 6, 5);
    if (lbit) {
        if (type == 1) {
            return ' arm.LDRH';
        }
    } else {
        if (type == 1) {
            return ' arm.STRH';
        }
    }

    return false;

}

matchers.push(testLoadStoreHalfwordReg);

function testLoadStoreHalfwordImm(row, col, fullInstruction) {
    if (!matchBitPattern("000xx1xx", row) || !matchBitPattern("1011", col)) {
        return false;
    }
    let lbit = getBit(fullInstruction, 20);
    let type = getBits(fullInstruction, 6, 5);
    if (lbit) {
        if (type == 1) {
            return ' arm.LDRH';
        }

    } else {
        if (type == 1) {
            return ' arm.STRH';
        }
    }

    return false;

}

matchers.push(testLoadStoreHalfwordImm);

function test_LDR_STR_SHB_REG(row, col, fullInstruction) {
    if (!matchBitPattern("000xx0x1", row) || !matchBitPattern("11x1", col)) {
        return false;
    }
    let lbit = getBit(fullInstruction, 20);
    let type = getBits(fullInstruction, 6, 5);
    if (lbit) {
        if (type == 2) {
            return ' arm.LDRSB';
        } else if (type == 3) {
            return ' arm.LDRSH';
        }
    }

    return false;

}

matchers.push(test_LDR_STR_SHB_REG);


function test_LDR_SHB_IMM(row, col, fullInstruction) {
    if (!matchBitPattern("000xx1x1", row) || !matchBitPattern("11x1", col)) {
        return false;
    }
    let lbit = getBit(fullInstruction, 20);
    let type = getBits(fullInstruction, 6, 5);
    if (lbit) {
        if (type == 2) {
            return ' arm.LDRSB';
        } else if (type == 3) {
            return ' arm.LDRSH';
        }
    }

    return false;

}

matchers.push(test_LDR_SHB_IMM);


function test_DATA_IMM(row, col, fullInstruction) {
    if (!matchBitPattern("001xxxxx", row) || !matchBitPattern("xxxx", col)) {
        return false;
    }
    let aluOpcode = getBits(fullInstruction, 24, 21);
    let sBit = getBit(fullInstruction, 20);
    if (!sBit && aluOpcode >= 0x8 && aluOpcode <= 0xb) {
        return false;
    }

    return aluOpSwitch(aluOpcode);

}

matchers.push(test_DATA_IMM)


function test_UND(row, col, fullInstruction) {
    if (!matchBitPattern("00110x00", row) || !matchBitPattern("xxxx", col)) {
        return false;
    }

    return 'null';
}

matchers.push(test_UND)


function test_IMM_TO_STATUS(row, col, fullInstruction) {
    if (!matchBitPattern("00110x10", row) || !matchBitPattern("xxxx", col)) {
        return false;
    }

    return 'arm.MSR';
}

matchers.push(test_IMM_TO_STATUS);


function test_LDR_STR_IMM(row, col, fullInstruction) {
    if (!matchBitPattern("010xxxxx", row) || !matchBitPattern("xxxx", col)) {
        return false;
    }
    let tBit = getBit(fullInstruction, 21);
    let pBit = getBit(fullInstruction, 24);
    let lbit = getBit(fullInstruction, 20);
    let bBit = getBit(fullInstruction, 22);
    if (lbit) {
        if (!pBit && tBit && bBit) {

            return ' arm.LDRBT';
        }
        else if (!pBit && tBit) {
            return ' arm.LDRT';
        }
        else if (bBit) {
            return ' arm.LDRB';
        }
        else {
            return ' arm.LDR';
        }
    } else {
        if (!pBit && tBit && bBit) {
            return ' arm.STRBT';
        }
        else if (!pBit && tBit) {
            return ' arm.STRT';
        }
        else if (bBit) {
            return ' arm.STRB';
        }
        else {
            return ' arm.STR';
        }

    }

}

matchers.push(test_LDR_STR_IMM);

function test_LDR_STR_REG(row, col, fullInstruction) {
    if (!matchBitPattern("011xxxxx", row) || !matchBitPattern("xxx0", col)) {
        return false;
    }
    let tBit = getBit(fullInstruction, 21);
    let pBit = getBit(fullInstruction, 24);
    let lbit = getBit(fullInstruction, 20);
    let bBit = getBit(fullInstruction, 22);
    if (lbit) {
        if (!pBit && tBit && bBit) {

            return ' arm.LDRBT';
        }
        else if (!pBit && tBit) {
            return ' arm.LDRT';
        }
        else if (bBit) {
            return ' arm.LDRB';
        }
        else {
            return ' arm.LDR';
        }
    } else {
        if (!pBit && tBit && bBit) {
            return ' arm.STRBT';
        }
        else if (!pBit && tBit) {
            return ' arm.STRT';
        }
        else if (bBit) {
            return ' arm.STRB';
        }
        else {
            return ' arm.STR';
        }

    }

}

matchers.push(test_LDR_STR_REG);

function test_UND2(row, col, fullInstruction) {
    if (!matchBitPattern("011xxxxx", row) || !matchBitPattern("xxx1", col)) {
        return false;
    }

    return 'null';
}

matchers.push(test_UND2)

function test_UND3(row, col, fullInstruction) {
    if (!matchBitPattern("0xxxxxxx", row) || !matchBitPattern("xxx0", col)) {
        return false;
    }

    return 'null';
}

matchers.push(test_UND3)

function test_LD_STR_MULTIPLE(row, col, fullInstruction) {
    if (!matchBitPattern("100xxxxx", row) || !matchBitPattern("xxxx", col)) {
        return false;
    }

    let lbit = getBit(fullInstruction, 20);
    let sBit = getBit(fullInstruction, 22);

    if (lbit && !sBit) {
        return ' arm.LDM';
    } else if (lbit && sBit) {
        return ' arm.LDM2';
    } else if (!lbit && !sBit) {
        return ' arm.STM';
    } else if (!lbit && sBit) {
        return ' arm.STM2';
    }
}

matchers.push(test_LD_STR_MULTIPLE);


function test_B_BL(row, col, fullInstruction) {
    if (!matchBitPattern("101xxxxx", row) || !matchBitPattern("xxxx", col)) {
        return false;
    }

    return 'arm.BBL';
}

matchers.push(test_B_BL);

function test_SWI(row, col, fullInstruction) {
    if (!matchBitPattern("1111xxxx", row) || !matchBitPattern("xxxx", col)) {
        return false;
    }
    return 'arm.SWI';
}

matchers.push(test_SWI);



// Generator Logic

let file = `
import { ARM7CPU } from '../cpu';
import * as arm from './arm/arm';
import { opHandler } from "./instructions";

export const armOpTable:  StaticArray<StaticArray<opHandler | null>> = [



`;

for (let row = 0; row < 256; ++row) {
    let arrayCol = `/** 0x${row.toString(16)} **/[`;
    for (let col = 0; col < 16; ++col) {

        let fullInstruction = (row << 20) | (col << 4);
        let op;
        matchers.some(func => {
            op = func(row, col, fullInstruction)
            return op;
        });

        arrayCol += op ? op : ' null';
        if (col != 15)
            arrayCol += ',';
    }

    arrayCol += "]";
    if (row != 255)
        arrayCol += ",";
    file += ("\n" + arrayCol)
}

file += ('\n' + ']')

let filePath = path.resolve(__dirname, "../assembly/cpu/instructions", "arm-op-table.ts");

fs.writeFileSync(filePath, file, { flag: 'w' });
