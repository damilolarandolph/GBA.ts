import { getBit, getBits } from "../../../utils/bits";
import { i32, u32 } from "../../../utils/types";
import { ARM7CPU } from "../../cpu";
import { StatusFlags } from "../../registers";
import { testCondition } from "../instructions";
import { dataProcFunc } from "./address-modes";



function carryFrom(lhs: u32, rhs: u32): boolean {
    return lhs > ((u32(0xffffffff)) - lhs);
}

function isNegative(val: u32): boolean {
    return getBit(val, 31);
}

function underflowFrom(lhs: u32, rhs: u32): boolean {
    return rhs > lhs;
}

function signOverflowFrom(lhs: u32, rhs: u32): boolean {
    let signedLhs = i32(lhs);
    let signedRhs = i32(rhs);
    let result = signedLhs + signedRhs;

    if (signedLhs < 0 && signedRhs < 0) {
        return result >= 0;
    } else if (signedLhs > 0 && signedRhs > 0) {
        return result <= 0;
    }

    return false;
}


export function adc(cpu: ARM7CPU, operandFunc: dataProcFunc): void {
    if (testCondition(cpu)) {
        cpu.enqueuePipeline(() => {
            let instruction = cpu.currentInstruction;
            let rn = getBits(instruction, 19, 16);
            let rnVal = cpu.readRegister(rn);
            let operand = operandFunc(instruction, cpu)[0];
            let cBit = cpu.flagVal(StatusFlags.CARRY);
            let result = u32(rnVal + operand + cBit);
        })
    }
}