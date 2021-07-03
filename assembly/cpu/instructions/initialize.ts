import { getBit, getBits } from '../../utils/bits';
import { ARM7CPU } from '../cpu';
import * as ARM from './arm/arm';
import { LDM, LDM2, STM, STM2 } from './arm/arm';
export type opHandler = (cpu: ARM7CPU) => void;
import { console } from '../../bridge';

export var armOpTable: StaticArray<opHandler | null> = new StaticArray(4096);

export function initARM(): void {

    for (let row = 0; row < 256; row++) {
        for (let col = 0; col < 16; col++) {
            let fullInstruction: u32 = (u32(row) << 20) | (u32(col) << 4);
            let arrIndex = row * 16 + col;

            if (ARM.isPSR(<u8>row, <u8>col) || ARM.isPSRImm(<u8>row, <u8>col)) {
                let mrsBit = getBit(fullInstruction, 21);
                if (!mrsBit) {
                    unchecked(armOpTable[arrIndex] = ARM.MRS);
                    //     // console.log(`MRS row ${row.toString(16)} col ${col.toString(16)}`);
                } else {
                    unchecked(armOpTable[arrIndex] = ARM.MSR);
                    //    // console.log(`MSR row ${row.toString(16)} col ${col.toString(16)}`);
                }
            }
            else if (ARM.isDataProcessingOrPSR(<u8>row, <u8>col)) {
                let opcode = (row >>> 1) & 0xf;
                let opFull = row * 16 + col;
                switch (opcode) {
                    case 0b0000:
                        unchecked(armOpTable[opFull] = ARM.AND);
                        //    // console.log(`AND row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b0001:
                        unchecked(armOpTable[opFull] = ARM.EOR);
                        //   // console.log(`EOR row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b0010:
                        unchecked(armOpTable[opFull] = ARM.SUB);
                        //   // console.log(`SUB row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b0011:
                        unchecked(armOpTable[opFull] = ARM.RSB);
                        //  // console.log(`RSB row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b0100:
                        unchecked(armOpTable[opFull] = ARM.ADD);
                        // console.log(`ADD row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b0101:
                        unchecked(armOpTable[opFull] = ARM.ADDC);
                        // console.log(`ADDC row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b0110:
                        unchecked(armOpTable[opFull] = ARM.SBC);
                        // console.log(`SBC row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b0111:
                        unchecked(armOpTable[opFull] = ARM.RSC);
                        // console.log(`RSC row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b1000:
                        unchecked(armOpTable[opFull] = ARM.TST);
                        // console.log(`TST row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b1001:
                        unchecked(armOpTable[opFull] = ARM.TEQ);
                        // console.log(`TEQ row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b1010:
                        unchecked(armOpTable[opFull] = ARM.CMP);
                        // console.log(`CMP row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b1011:
                        unchecked(armOpTable[opFull] = ARM.CMN);
                        // console.log(`CMN row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b1100:
                        unchecked(armOpTable[opFull] = ARM.ORR);
                        // console.log(`ORR row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b1101:
                        armOpTable[opFull] = ARM.MOV;
                        // console.log(`MOV row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b1110:
                        unchecked(armOpTable[opFull] = ARM.BIC);
                        // console.log(`BIC row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                    case 0b1111:
                        unchecked(armOpTable[opFull] = ARM.MVN);
                        // console.log(`MVN row ${row.toString(16)} col ${col.toString(16)}`);
                        break;
                }
            }


            //            Multiply

            else if (ARM.isMultiply(<u8>row, <u8>col)) {
                if (getBit(fullInstruction, 21)) {
                    // console.log(`MLA row ${row.toString(16)} col ${col.toString(16)}`);
                    armOpTable[arrIndex] = ARM.MLA
                } else {
                    // console.log(`MUL row ${row.toString(16)} col ${col.toString(16)}`);
                    armOpTable[arrIndex] = ARM.MUL
                }
            }

            // //Multiply Accumulate

            else if (ARM.isMultiplyLong(<u8>row, <u8>col)) {
                let uBit = getBit(fullInstruction, 22);
                let aBit = getBit(fullInstruction, 21);
                if (aBit) {
                    if (uBit) {
                        armOpTable[arrIndex] = ARM.SMLAL;
                        // console.log(`SMLAL row ${row.toString(16)} col ${col.toString(16)}`);
                    }
                    else {

                        // console.log(`UMLAL row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.UMLAL;
                    }
                }
                else {
                    if (uBit) {
                        armOpTable[arrIndex] = ARM.SMLUL;
                        // console.log(`SMLUL row ${row.toString(16)} col ${col.toString(16)}`);
                    }
                    else {
                        // console.log(`UMULL row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.UMULL;
                    }
                }
            }

            else if (ARM.isSingleDataSwap(<u8>row, <u8>col)) {
                if (getBit(fullInstruction, 22)) {

                    // console.log(`SWPB row ${row.toString(16)} col ${col.toString(16)}`);
                    armOpTable[arrIndex] = ARM.SWPB;
                } else {
                    // console.log(`SWP row ${row.toString(16)} col ${col.toString(16)}`);
                    armOpTable[arrIndex] = ARM.SWP;
                }
            }

            else if (ARM.isBranchExchange(<u8>row, <u8>col)) {

                // console.log(`BX row ${row.toString(16)} col ${col.toString(16)}`);
                armOpTable[arrIndex] = ARM.BX;
            }

            else if (ARM.isHalfwordDataTransferRegOff(<u8>row, <u8>col)) {
                let lbit = getBit(fullInstruction, 20);
                let type = getBits(fullInstruction, 6, 5);
                if (lbit) {
                    if (type == 0b01) {

                        // console.log(`LDRH row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRH;
                    } else if (type == 0b10) {

                        // console.log(`LDRSB row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRSB;
                    } else {

                        // console.log(`LDRSH row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRSH;
                    }
                } else {
                    if (type == 1) {
                        // console.log(`STRH row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.STRH;
                    }
                }
            }

            else if (ARM.isHalfwordDataTransferImmediateOff(<u8>row, <u8>col)) {
                let lbit = getBit(fullInstruction, 20);
                let type = getBits(fullInstruction, 6, 5);
                if (lbit) {
                    if (type == 0b01) {

                        // console.log(`LDRH row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRH;
                    } else if (type == 0b10) {

                        // console.log(`LDRSB row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRSB;
                    } else {

                        // console.log(`LDRSH row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRSH;
                    }
                } else {
                    if (type == 1) {
                        // console.log(`STRH row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.STRH;
                    }
                }


            }

            else if (ARM.isSingleDataTransfer(<u8>row, <u8>col)) {
                let tBit = getBit(fullInstruction, 21);
                let pBit = getBit(fullInstruction, 24);
                let lbit = getBit(fullInstruction, 20);
                let bBit = getBit(fullInstruction, 22);
                if (lbit) {
                    if (!pBit && tBit && bBit) {

                        // console.log(`LDRBT row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRBT;
                    }
                    else if (!pBit && tBit) {
                        // console.log(`LDRT row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRT;
                    }
                    else if (bBit) {
                        // console.log(`LDRB row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDRB;
                    }
                    else {
                        // console.log(`LDR row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.LDR;
                    }
                } else {
                    if (!pBit && tBit && bBit) {
                        // console.log(`STRBT row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.STRBT;
                    }
                    else if (!pBit && tBit) {
                        // console.log(`STRT row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.STRT
                    }
                    else if (bBit) {
                        // console.log(`STRB row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.STRB;
                    }
                    else {

                        // console.log(`STR row ${row.toString(16)} col ${col.toString(16)}`);
                        armOpTable[arrIndex] = ARM.STR;
                    }

                }
            }

            else if (ARM.undefined(<u8>row, <u8>col)) {

            }

            else if (ARM.isBlockDataTransfer(<u8>row, <u8>col)) {
                let lbit = getBit(fullInstruction, 20);
                let sBit = getBit(fullInstruction, 22);
                if (lbit && sBit) {
                    // console.log(`LDM2 row ${row.toString(16)} col ${col.toString(16)}`);
                    armOpTable[arrIndex] = LDM2;
                }
                else if (lbit) {
                    // console.log(`LDM row ${row.toString(16)} col ${col.toString(16)}`);
                    armOpTable[arrIndex] = LDM;
                }
                else if (!lbit && sBit) {
                    // console.log(`STM row ${row.toString(16)} col ${col.toString(16)}`);
                    armOpTable[arrIndex] = STM;
                }
                else if (!lbit) {
                    // console.log(`STM2 row ${row.toString(16)} col ${col.toString(16)}`);
                    armOpTable[arrIndex] = STM2;
                }
            }

            else if (ARM.isBranch(<u8>row, <u8>col)) {
                // console.log(`BBL row ${row.toString(16)} col ${col.toString(16)}`);
                armOpTable[arrIndex] = ARM.BBL;
            }
            else if (ARM.isSoftwareInterrupt(<u8>row, <u8>col)) {
                // console.log(`SWI row ${row.toString(16)} col ${col.toString(16)}`);
                armOpTable[arrIndex] = ARM.SWI;
            }

        }
    }
}
