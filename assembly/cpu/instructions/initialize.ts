import { getBit, getBits } from '../../utils/bits';
import { ARM7CPU } from '../cpu';
import * as ARM from './arm/arm';
import { LDM, LDM2, STM, STM2 } from './arm/arm';
export type opHandler = (cpu: ARM7CPU) => void;

export var armOpTable: StaticArray<opHandler | null> = new StaticArray(4096);

export function initARM(): void {

    for (let row = 0; row < 256; row++) {
        for (let col = 0; col < 16; col++) {
            let fullInstruction: u32 = (row << 24) & col;
            let arrIndex = row * col;
            if (ARM.isDataProcessingOrPSR(<u8>row, <u8>col)) {
                let opcode = (row >>> 1) & 0xf;
                let opFull = row * col;
                switch (opcode) {
                    case 0b0000:
                        unchecked(armOpTable[opFull] = ARM.AND);
                        break;
                    case 0b0001:
                        unchecked(armOpTable[opFull] = ARM.EOR);
                        break;
                    case 0b0010:
                        unchecked(armOpTable[opFull] = ARM.SUB);
                        break;
                    case 0b0011:
                        unchecked(armOpTable[opFull] = ARM.RSB);
                        break;
                    case 0b0100:
                        unchecked(armOpTable[opFull] = ARM.ADD);
                        break;
                    case 0b0101:
                        unchecked(armOpTable[opFull] = ARM.ADDC);
                        break;
                    case 0b0110:
                        unchecked(armOpTable[opFull] = ARM.SBC);
                        break;
                    case 0b0111:
                        unchecked(armOpTable[opFull] = ARM.RSC);
                        break;
                    case 0b1000:
                        unchecked(armOpTable[opFull] = ARM.TST);
                        break;
                    case 0b1001:
                        unchecked(armOpTable[opFull] = ARM.TEQ);
                        break;
                    case 0b1010:
                        unchecked(armOpTable[opFull] = ARM.CMP);
                        break;
                    case 0b1011:
                        unchecked(armOpTable[opFull] = ARM.CMN);
                        break;
                    case 0b1100:
                        unchecked(armOpTable[opFull] = ARM.ORR);
                        break;
                    case 0b1101:
                        unchecked(armOpTable[opFull] = ARM.MOV);
                        break;
                    case 0b1110:
                        unchecked(armOpTable[opFull] = ARM.BIC);
                        break;
                    case 0b1111:
                        unchecked(armOpTable[opFull] = ARM.MVN);
                        break;
                }
                continue
            }


            //Multiply

            else if (ARM.isMultiply(<u8>row, <u8>col)) {
                if (getBit(fullInstruction, 21)) {
                    armOpTable[arrIndex] = ARM.MLA
                } else {
                    armOpTable[arrIndex] = ARM.MUL
                }
            }

            //Multiply Accumulate

            else if (ARM.isMultiplyLong(<u8>row, <u8>col)) {
                let uBit = getBit(fullInstruction, 22);
                let aBit = getBit(fullInstruction, 21);
                if (aBit) {
                    if (uBit)
                        armOpTable[arrIndex] = ARM.SMLAL;
                    else
                        armOpTable[arrIndex] = ARM.UMLAL;
                }
                else {
                    if (uBit)
                        armOpTable[arrIndex] = ARM.SMLUL;
                    else
                        armOpTable[arrIndex] = ARM.UMULL;
                }
            }

            else if (ARM.isSingleDataSwap(<u8>row, <u8>col)) {
                if (getBit(fullInstruction, 22)) {
                    armOpTable[arrIndex] = ARM.SWPB;
                } else {
                    armOpTable[arrIndex] = ARM.SWP;
                }
            }

            else if (ARM.isBranchExchange(<u8>row, <u8>col)) {
                armOpTable[arrIndex] = ARM.BX;
            }

            else if (ARM.isHalfwordDataTransferRegOff(<u8>row, <u8>col)) {
                let lbit = getBit(fullInstruction, 20);
                let type = getBits(fullInstruction, 6, 5);
                if (lbit) {
                    if (type == 0b01) {
                        armOpTable[arrIndex] = ARM.LDRH;
                    } else if (type == 0b10) {
                        armOpTable[arrIndex] = ARM.LDRSB;
                    } else {
                        armOpTable[arrIndex] = ARM.LDRSH;
                    }
                } else {
                    if (type == 1)
                        armOpTable[arrIndex] = ARM.STRH;
                }
            }

            else if (ARM.isHalfwordDataTransferImmediateOff(<u8>row, <u8>col)) {
                let lbit = getBit(fullInstruction, 20);
                let type = getBits(fullInstruction, 6, 5);
                if (lbit) {
                    if (type == 0b01) {
                        armOpTable[arrIndex] = ARM.LDRH;
                    } else if (type == 0b10) {
                        armOpTable[arrIndex] = ARM.LDRSB;
                    } else {
                        armOpTable[arrIndex] = ARM.LDRSH;
                    }
                } else {
                    if (type == 1)
                        armOpTable[arrIndex] = ARM.STRH;
                }

            }

            else if (ARM.isSingleDataTransfer(<u8>row, <u8>col)) {
                let tBit = getBit(fullInstruction, 21);
                let pBit = getBit(fullInstruction, 24);
                let lbit = getBit(fullInstruction, 20);
                let bBit = getBit(fullInstruction, 22);
                if (lbit) {
                    if (!pBit && tBit && bBit)
                        armOpTable[arrIndex] = ARM.LDRBT;
                    else if (!pBit && tBit)
                        armOpTable[arrIndex] = ARM.LDRT;
                    else if (bBit)
                        armOpTable[arrIndex] = ARM.LDRB;
                    else
                        armOpTable[arrIndex] = ARM.LDR;
                } else {
                    if (!pBit && tBit && bBit)
                        armOpTable[arrIndex] = ARM.STRBT;
                    else if (!pBit && tBit)
                        armOpTable[arrIndex] = ARM.STRT
                    else if (bBit)
                        armOpTable[arrIndex] = ARM.STRB;
                    else
                        armOpTable[arrIndex] = ARM.STR;

                }
            }

            else if (ARM.undefined(<u8>row, <u8>col)) {

            }

            else if (ARM.isBlockDataTransfer(<u8>row, <u8>col)) {
                let lbit = getBit(fullInstruction, 20);
                let sBit = getBit(fullInstruction, 22);
                if (lbit && sBit)
                    armOpTable[arrIndex] = LDM2;
                else if (lbit)
                    armOpTable[arrIndex] = LDM;
                else if (!lbit && sBit)
                    armOpTable[arrIndex] = STM;
                else if (!lbit)
                    armOpTable[arrIndex] = STM2;
            }

            else if (ARM.isBranch(<u8>row, <u8>col)) {
                armOpTable[arrIndex] = ARM.BBL;
            } else if (ARM.isSoftwareInterrupt(<u8>row, <u8>col)) {
                armOpTable[arrIndex] = ARM.SWI;
            }

        }
    }
}
