import { getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, CPU_MODES } from "../../cpu";
import { StatusFlags } from "../../registers";
import { testCondition } from "../instructions";
import { operand, rotateRight, shifterOut } from "./address-modes";



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

export function deduceAddressing(cpu: ARM7CPU): void {

}

export function ADDC(cpu: ARM7CPU): void {
    switch (cpu.instructionStage) {
        case 0:
            if (!testCondition(cpu)) {

            }
            deduceAddressing(cpu);
        default:
            let instruction = cpu.currentInstruction;
            let rd = getBits(instruction, 15, 12);
            let rn = getBits(instruction, 19, 16);
            let rnVal = cpu.readRegister(rn);
            let sBit = getBit(instruction, 20);
            let carryOut = cpu.flagVal(StatusFlags.CARRY);
            let result = rnVal + operand + carryOut;
            cpu.writeRegister(rd, result);
            if (sBit && rd == 15) {
                cpu.CPSR = cpu.SPSR;
            } else {
                cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
                cpu.setFlag(StatusFlags.ZERO, result == 0);
                cpu.setFlag(StatusFlags.CARRY, carryFrom(rnVal, operand + carryOut));
                cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(rnVal, operand + carryOut));
            }
    }
}

export function ADD(cpu: ARM7CPU): void {
    switch (cpu.instructionStage) {
        case 0:
            if (!testCondition(cpu)) {

            }
            deduceAddressing(cpu);
        default:
            let instruction = cpu.currentInstruction;
            let rd = getBits(instruction, 15, 12);
            let rn = getBits(instruction, 19, 16);
            let rnVal = cpu.readRegister(rn);
            let sBit = getBit(instruction, 20);
            let result = rnVal + operand;
            cpu.writeRegister(rd, result);
            if (sBit && rd == 15) {
                cpu.CPSR = cpu.SPSR;
            } else {
                cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
                cpu.setFlag(StatusFlags.ZERO, result == 0);
                cpu.setFlag(StatusFlags.CARRY, carryFrom(rnVal, operand));
                cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(rnVal, operand));
            }
    }
}




export function AND(cpu: ARM7CPU): void {
    switch (cpu.instructionStage) {
        case 0:
            if (!testCondition(cpu)) { }
            deduceAddressing(cpu);
        default:
            let instruction = cpu.currentInstruction;
            let rd = getBits(instruction, 15, 12);
            let rn = getBits(instruction, 19, 16);
            let rnVal = cpu.readRegister(rn);
            let sBit = getBit(instruction, 20);
            let result = rnVal & operand;
            cpu.writeRegister(rd, result);
            if (sBit && rd == 15) {
                cpu.CPSR = cpu.SPSR;
            } else {
                cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
                cpu.setFlag(StatusFlags.ZERO, result == 0);
                cpu.setFlag(StatusFlags.CARRY, shifterOut == 0 ? false : true);
            }
    }
}


export function BIC(cpu: ARM7CPU): void {
    switch (cpu.instructionStage) {
        case 0:
            if (!testCondition(cpu)) { }
            deduceAddressing(cpu);
        default:
            let instruction = cpu.currentInstruction;
            let rd = getBits(instruction, 15, 12);
            let rn = getBits(instruction, 19, 16);
            let rnVal = cpu.readRegister(rn);
            let sBit = getBit(instruction, 20);
            let result = rnVal & (~operand);
            cpu.writeRegister(rd, result);
            if (sBit && rd == 15) {
                cpu.CPSR = cpu.SPSR;
            } else {
                cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
                cpu.setFlag(StatusFlags.ZERO, result == 0);
                cpu.setFlag(StatusFlags.CARRY, shifterOut == 0 ? false : true);
            }
    }
}


export function CMN(cpu: ARM7CPU): void {
    switch (cpu.instructionStage) {
        case 0:
            if (!testCondition(cpu)) { }
            deduceAddressing(cpu);
        case 1:
            let instruction = cpu.currentInstruction;
            let rn = getBits(instruction, 19, 16);
            let rnVal = cpu.readRegister(rn);
            let result = i32(rnVal) + i32(operand);
            cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
            cpu.setFlag(StatusFlags.ZERO, result == 0);
            cpu.setFlag(StatusFlags.CARRY, carryFrom(rnVal, operand));
            cpu.setFlag(StatusFlags.CARRY, signOverflowFrom(rnVal, operand));
    }
}



export function CMP(cpu: ARM7CPU): void {
    switch (cpu.instructionStage) {
        case 0:
            if (!testCondition(cpu)) { };
            deduceAddressing(cpu);
        default:
            let instruction = cpu.currentInstruction;
            let rn = getBits(instruction, 19, 16);
            let rnVal = cpu.readRegister(rn);
            let result = i32(rnVal) - i32(operand);
            cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
            cpu.setFlag(StatusFlags.ZERO, result == 0);
            cpu.setFlag(StatusFlags.CARRY, !underflowFrom(rnVal, operand));
            cpu.setFlag(StatusFlags.CARRY, signOverflowFrom(rnVal, i32(operand) * -1));
    }
}


export function EOR(cpu: ARM7CPU): void {
    switch (cpu.instructionStage) {
        case 0:
            if (!testCondition(cpu)) { }
            deduceAddressing(cpu)
        default:
            let instruction = cpu.currentInstruction;
            let rd = getBits(instruction, 15, 12);
            let rn = getBits(instruction, 19, 16);
            let rnVal = cpu.readRegister(rn);
            let sBit = getBit(instruction, 20);
            let result = rnVal ^ operand;
            cpu.writeRegister(rd, result);
            if (sBit && rd == 15) {
                cpu.CPSR = cpu.SPSR;
            } else {
                cpu.setFlag(StatusFlags.NEGATIVE, isNegative(result));
                cpu.setFlag(StatusFlags.ZERO, result == 0);
                cpu.setFlag(StatusFlags.CARRY, shifterOut == 1 ? true : false);
            }
    }
}



export function MOV(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rd = getBits(cpu.currentInstruction, 15, 12);
    let sBit = getBit(cpu.instructionStage, 20);

    if (cpu.instructionStage == 1) {
        cpu.writeRegister(rd, operand);
        if (!sBit) { }
        if (rd == 15) {
            cpu.CPSR = cpu.SPSR;
        } else {
            cpu.setFlag(StatusFlags.NEGATIVE, getBit(operand, 31));
            cpu.setFlag(StatusFlags.ZERO, operand == 0);
            cpu.setFlag(StatusFlags.CARRY, shifterOut != 0);
        }
    }
}


export function MRS(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        cpu.instructionStage = 1;
    }

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (cpu.instructionStage == 2) {
        if (getBit(cpu.currentInstruction, 22)) {
            cpu.writeRegister(rd, cpu.SPSR);
        } else {
            cpu.writeRegister(rd, cpu.CPSR);
        }
    }
}

export function MSR(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        cpu.instructionStage = 1;
    }

    let Rbit = getBit(cpu.currentInstruction, 22);
    let fieldMask = getBits(cpu.currentInstruction, 19, 16);

    let msrOP: u32;
    if (getBit(cpu.currentInstruction, 25)) {
        rotateRight(
            getBits(cpu.currentInstruction, 7, 0),
            getBits(cpu.currentInstruction, 11, 8) * 2,
            cpu);
        msrOP = operand;
    } else {
        msrOP = cpu.readRegister(getBits(cpu.currentInstruction, 3, 0));
    }

    if (Rbit) {
        if (cpu.mode == CPU_MODES.USR) { return; }
        if (getBit(fieldMask, 0)) {
            cpu.CPSR &= (msrOP & 0xf);
        }

        if (getBit(fieldMask, 1)) {
            let mask = ~(u32(0xff) << 8);
            mask &= cpu.CPSR;
            mask |= msrOP << 8;
            cpu.CPSR = mask;
        }

        if (getBit(fieldMask, 2)) {
            let mask = ~(u32(0xff) << 16);
            mask &= cpu.CPSR;
            mask |= msrOP << 16;
            cpu.CPSR = mask;
        }
        if (getBit(fieldMask, 3)) {
            let mask = ~(u32(0xff) << 24);
            mask &= cpu.CPSR;
            mask |= msrOP << 24;
            cpu.CPSR = mask;
        }

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

    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rd = getBits(cpu.currentInstruction, 15, 12);
    let sBit = getBit(cpu.currentInstruction, 20);
    if (cpu.instructionStage == 1) {
        let result = ~operand;
        cpu.writeRegister(rd, result);
        if (sBit && rd == 15) {
            cpu.CPSR = cpu.SPSR
        } else {
            cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
            cpu.setFlag(StatusFlags.ZERO, result == 0);
            cpu.setFlag(StatusFlags.CARRY, shifterOut != 0);
        }
    }

}

export function ORR(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }


    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);

    if (cpu.instructionStage == 1) {
        let result = cpu.readRegister(rn) | operand;
        cpu.writeRegister(rd, result);
        if (sBit && rd == 15) {
            cpu.CPSR = cpu.SPSR;
        } else if (sBit) {
            cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
            cpu.setFlag(StatusFlags.ZERO, result == 0);
            cpu.setFlag(StatusFlags.CARRY, shifterOut != 0);
        }
    }
}

export function RSB(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    if (cpu.instructionStage == 1) {
        let result = operand - cpu.readRegister(rn);
        if (sBit && rd == 15) {
            cpu.CPSR = cpu.SPSR;
        } else if (sBit) {
            cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
            cpu.setFlag(StatusFlags.ZERO, result == 0);
            cpu.setFlag(StatusFlags.CARRY, !underflowFrom(operand, cpu.readRegister(rn)))
            cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(operand, i32(cpu.readRegister(rn)) * -1))
        }
    }
}

export function RSC(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    if (cpu.instructionStage == 1) {
        let notC = cpu.isFlag(StatusFlags.CARRY) ? 0 : 1;
        let result = operand - (cpu.readRegister(rn) + notC);
        if (sBit && rd == 15) {
            cpu.CPSR = cpu.SPSR;
        } else if (sBit) {
            cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
            cpu.setFlag(StatusFlags.ZERO, result == 0);
            cpu.setFlag(StatusFlags.CARRY, !underflowFrom(operand, cpu.readRegister(rn) + notC))
            cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(operand, i32(cpu.readRegister(rn) + notC) * -1))
        }
    }
}

export function SUB(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    if (cpu.instructionStage == 1) {
        let result = cpu.readRegister(rn) - operand;
        if (sBit && rd == 15) {
            cpu.CPSR = cpu.SPSR;
        } else if (sBit) {
            cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
            cpu.setFlag(StatusFlags.ZERO, result == 0);
            cpu.setFlag(StatusFlags.CARRY, !underflowFrom(cpu.readRegister(rn), operand))
            cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(cpu.readRegister(rn), i32(operand) * -1))
        }
    }
}

export function SBC(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    if (cpu.instructionStage == 1) {
        let notC = cpu.isFlag(StatusFlags.CARRY) ? 0 : 1;
        let result = cpu.readRegister(rn) - (operand + notC);
        if (sBit && rd == 15) {
            cpu.CPSR = cpu.SPSR;
        } else if (sBit) {
            cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
            cpu.setFlag(StatusFlags.ZERO, result == 0);
            cpu.setFlag(StatusFlags.CARRY, !underflowFrom(cpu.readRegister(rn), operand + notC))
            cpu.setFlag(StatusFlags.OVERFLOW, signOverflowFrom(cpu.readRegister(rn), i32(operand + notC) * -1))
        }
    }
}

export function TEQ(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rn = getBits(cpu.currentInstruction, 19, 16);
    let result = cpu.readRegister(rn) ^ operand;
    cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
    cpu.setFlag(StatusFlags.ZERO, result == 0);
    cpu.setFlag(StatusFlags.CARRY, shifterOut == 0);
}

export function TST(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rn = getBits(cpu.currentInstruction, 19, 16);
    let result = cpu.readRegister(rn) & operand;
    cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
    cpu.setFlag(StatusFlags.ZERO, result == 0);
    cpu.setFlag(StatusFlags.CARRY, shifterOut == 0);
}










