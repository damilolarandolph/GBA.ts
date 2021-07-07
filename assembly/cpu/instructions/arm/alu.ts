import { getBit, getBits } from "../../../utils/bits";
import PaletteRam from "../../../video/palette-ram";
import { ARM7CPU, CPU_MODES, StatusFlags } from "../../cpu";
import { testCondition } from "../instructions";
import { asri, asrr, dataProcImmediate, lsli, lslr, lsri, lsrr, rori, rorr, rotateRight, ShifterOutput, } from "./address-modes";



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

export function deduceAddressing(cpu: ARM7CPU): ShifterOutput {
    let currentInstruction = cpu.currentInstruction;
    let immediateFlag = getBit(currentInstruction, 25);
    if (immediateFlag) {
        return dataProcImmediate(currentInstruction, cpu);
    }

    let shiftRegFlag = getBit(currentInstruction, 4);
    let shiftType = getBits(currentInstruction, 6, 5);

    if (shiftRegFlag) {
        if (shiftType == 0)
            return lslr(cpu);
        else if (shiftType == 1)
            return lsrr(cpu);
        else if (shiftType == 2)
            return asrr(cpu);
        else if (shiftType == 3)
            return rorr(currentInstruction, cpu);
    } else {
        if (shiftType == 0)
            return lsli(cpu);
        else if (shiftType == 1)
            return lsri(cpu);
        else if (shiftType == 2)
            return asri(cpu);
        else if (shiftType == 3)
            return rori(cpu);
    }

    throw new Error("ADDRESSING NOT FOUND");
}

export function ADDC(cpu: ARM7CPU): void {
    let shifterOut = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let carryOut = cpu.flagVal(StatusFlags.CARRY);
    let result = rnVal + shifterOut.operand + carryOut;
    cpu.writeRegister(rd, result);
    if (sBit && rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, carryFrom(rnVal, shifterOut.operand + carryOut));
        cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(rnVal, shifterOut.operand + carryOut));
    }

}

export function ADD(cpu: ARM7CPU): void {
    let shifterOut = deduceAddressing(cpu);

    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let result = rnVal + shifterOut.operand;
    cpu.writeRegister(rd, result);
    if (!sBit) {
        return;
    }
    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, carryFrom(rnVal, shifterOut.operand));
        cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(rnVal, shifterOut.operand));
    }
}




export function AND(cpu: ARM7CPU): void {
    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let result = rnVal & shifterOutput.operand;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, shifterOutput.shifterOut == 0 ? false : true);
    }
}


export function BIC(cpu: ARM7CPU): void {
    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let result = rnVal & (~shifterOutput.operand);
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, shifterOutput.shifterOut == 0 ? false : true);
    }
}


export function CMN(cpu: ARM7CPU): void {
    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let result = rnVal + shifterOutput.operand;
    cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
    cpu.setFlag(StatusFlags.ZERO, result == 0);
    cpu.setFlag(StatusFlags.CARRY, carryFrom(rnVal, shifterOutput.operand));
    cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(rnVal, shifterOutput.operand));
}



export function CMP(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let result = rnVal - shifterOutput.operand;
    cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
    cpu.setFlag(StatusFlags.ZERO, result == 0);
    cpu.setFlag(StatusFlags.CARRY, !underflowFrom(rnVal, shifterOutput.operand));
    cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(rnVal, i32(shifterOutput.operand) * -1));
}


export function EOR(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let result = rnVal ^ shifterOutput.operand;
    cpu.writeRegister(rd, result);
    if (!sBit) {
        return
    }
    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, shifterOutput.shifterOut == 1 ? true : false);
    }
}



export function MOV(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.writeRegister(rd, shifterOutput.operand);
    if (!sBit) {
        return;
    }
    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(shifterOutput.operand, 31));
        cpu.setFlag(StatusFlags.ZERO, shifterOutput.operand == 0);
        cpu.setFlag(StatusFlags.CARRY, shifterOutput.shifterOut != 0);
    }
}


export function MRS(cpu: ARM7CPU): void {

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (getBit(cpu.currentInstruction, 22)) {
        cpu.writeRegister(rd, cpu.SPSR);
    } else {
        cpu.writeRegister(rd, cpu.CPSR);
    }
}

export function MSR(cpu: ARM7CPU): void {

    let Rbit = getBit(cpu.currentInstruction, 22);
    let fieldMask = getBits(cpu.currentInstruction, 19, 16);

    let msrOP: u32;
    if (getBit(cpu.currentInstruction, 25)) {
        msrOP = rotateRight(
            getBits(cpu.currentInstruction, 7, 0),
            getBits(cpu.currentInstruction, 11, 8) * 2,
            cpu).operand;
    } else {
        msrOP = cpu.readRegister(getBits(cpu.currentInstruction, 3, 0));
    }

    if (!Rbit) {

        let newcspr = cpu.CPSR;
        if (getBit(fieldMask, 3)) {
            let mask = getBits(msrOP, 31, 24);
            mask = mask << 24;
            let maskInvert = u32(0xff) << 24;
            maskInvert = ~maskInvert;
            newcspr = (newcspr & maskInvert) | mask;
        }
        if (cpu.mode == CPU_MODES.USR || cpu.mode == CPU_MODES.SYS) {
            cpu.CPSR = newcspr;
            return;
        }
        if (getBit(fieldMask, 0)) {
            let mask = msrOP & 0xf;
            newcspr = newcspr & mask;
        }

        if (getBit(fieldMask, 1)) {
            let mask = getBits(msrOP, 15, 8);
            mask = mask << 8;
            let maskInvert = u32(0xff) << 8;
            maskInvert = ~maskInvert
            newcspr = (newcspr & maskInvert) | mask;
        }

        if (getBit(fieldMask, 2)) {
            let mask = getBits(msrOP, 23, 16);
            mask = mask << 16;
            let maskInvert = u32(0xff) << 16;
            maskInvert = ~maskInvert
            newcspr = (newcspr & maskInvert) | mask;
        }

        cpu.CPSR = newcspr;


    } else {
        if (cpu.mode == CPU_MODES.USR || cpu.mode == CPU_MODES.SYS) { }
        if (getBit(fieldMask, 0)) {
            cpu.SPSR &= (msrOP & 0xf);
        }

        if (getBit(fieldMask, 1)) {
            let mask = ~(u32(0xff) << 8);
            mask &= cpu.CPSR;
            mask |= msrOP << 8;
            cpu.SPSR = mask;
        }

        if (getBit(fieldMask, 2)) {
            let mask = ~(u32(0xff) << 16);
            mask &= cpu.CPSR;
            mask |= msrOP << 16;
            cpu.SPSR = mask;
        }
        if (getBit(fieldMask, 3)) {
            let mask = ~(u32(0xff) << 24);
            mask &= cpu.CPSR;
            mask |= msrOP << 24;
            cpu.SPSR = mask;
        }
    }

}


export function MVN(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    let sBit = getBit(cpu.currentInstruction, 20);
    let result = ~shifterOutput.operand;
    cpu.writeRegister(rd, result);
    if (!sBit) {
        return;
    }
    if (rd == 15) {
        cpu.CPSR = cpu.SPSR
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, shifterOutput.shifterOut != 0);
    }

}

export function ORR(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);


    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);

    let result = cpu.readRegister(rn) | shifterOutput.operand;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, shifterOutput.shifterOut != 0);
    }
}

export function RSB(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let result = shifterOutput.operand - cpu.readRegister(rn);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, !underflowFrom(shifterOutput.operand, cpu.readRegister(rn)))
        cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(shifterOutput.operand, i32(cpu.readRegister(rn)) * -1))
    }
}

export function RSC(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let notC = cpu.isFlag(StatusFlags.CARRY) ? 0 : 1;
    let result = shifterOutput.operand - (cpu.readRegister(rn) + notC);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, !underflowFrom(shifterOutput.operand, cpu.readRegister(rn) + notC))
        cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(shifterOutput.operand, i32(cpu.readRegister(rn) + notC) * -1))
    }
}

export function SUB(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let rnVal = cpu.readRegister(rn);
    let result = rnVal - shifterOutput.operand;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
        cpu.setFlag(StatusFlags.ZERO, (result == 0));
        cpu.setFlag(StatusFlags.CARRY, !underflowFrom(rnVal, shifterOutput.operand))
        cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(rnVal, i32(shifterOutput.operand) * -1))
    }
}

export function SBC(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let notC = cpu.isFlag(StatusFlags.CARRY) ? 0 : 1;
    let result = cpu.readRegister(rn) - (shifterOutput.operand + notC);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.CPSR = cpu.SPSR;
    } else {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
        cpu.setFlag(StatusFlags.CARRY, !underflowFrom(cpu.readRegister(rn), shifterOutput.operand + notC))
        cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(cpu.readRegister(rn), i32(shifterOutput.operand + notC) * -1))
    }
}

export function TEQ(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);

    let rn = getBits(cpu.currentInstruction, 19, 16);
    let result = cpu.readRegister(rn) ^ shifterOutput.operand;
    cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
    cpu.setFlag(StatusFlags.ZERO, result == 0);
    cpu.setFlag(StatusFlags.CARRY, shifterOutput.shifterOut != 0);
}

export function TST(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);

    let rn = getBits(cpu.currentInstruction, 19, 16);
    let result = cpu.readRegister(rn) & shifterOutput.operand;
    cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
    cpu.setFlag(StatusFlags.ZERO, result == 0);
    cpu.setFlag(StatusFlags.CARRY, shifterOutput.shifterOut != 0);
}










