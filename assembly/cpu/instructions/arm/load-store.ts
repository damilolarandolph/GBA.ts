import { getBit, getBits, setBit } from "../../../utils/bits";
import { ARM7CPU, CPU_MODES } from "../../cpu";
import { StatusFlags } from "../../registers";
import { testCondition } from "../instructions";
import { ldmEndAddr, ldmStartAddr, loadStrAddr, operand, rotateRight } from "./address-modes";

var currentAddress: u32;
export function deduceLDMAddressing(cpu: ARM7CPU): void {

}

export function deduceByteAddressing(cpu: ARM7CPU): void { }

export function deduceMiscAddressing(cpu: ARM7CPU): void { }

var currentRegIndex: u32 = 0;
var regList: u32 = 0;
export function LDM(cpu: ARM7CPU): void {

    if (cpu.instructionStage == 1) {
        if (!testCondition(cpu)) { }
        deduceLDMAddressing(cpu);
        regList = getBits(cpu.currentInstruction, 15, 0);
        currentRegIndex = 0;
        currentAddress = ldmStartAddr;
    }

    if (cpu.instructionStage == 2) {
        for (; currentRegIndex < 15; ++currentRegIndex) {
            if (getBit(regList, currentRegIndex)) {
                cpu.writeRegister(currentRegIndex, cpu.read32(currentAddress));
                currentAddress += 4;
                return;
            }
        }
        cpu.instructionStage = 3;
    }
    if (cpu.instructionStage == 3) {
        if (getBit(regList, currentRegIndex)) {
            cpu.PC = cpu.read32(currentAddress);
        }
    }
}
export function STM(cpu: ARM7CPU): void {

    if (cpu.instructionStage == 1) {
        if (!testCondition(cpu)) { }
        deduceLDMAddressing(cpu);
        regList = getBits(cpu.currentInstruction, 15, 0);
        currentRegIndex = 0;
        currentAddress = ldmStartAddr;
    }

    if (cpu.instructionStage == 2) {
        for (; currentRegIndex < 15; ++currentRegIndex) {
            if (getBit(regList, currentRegIndex)) {
                cpu.write32(currentAddress, cpu.readRegister(currentRegIndex));
                currentAddress += 4;
                return;
            }
        }
        cpu.instructionStage = 3;
    }
    if (cpu.instructionStage == 3) {
    }
}

export function LDM2(cpu: ARM7CPU): void {

    if (cpu.instructionStage == 1) {
        if (!testCondition(cpu)) { }
        deduceLDMAddressing(cpu);
        regList = getBits(cpu.currentInstruction, 14, 0);
        currentRegIndex = 0;
        currentAddress = ldmStartAddr;
        cpu.instructionStage = 2;
    }

    if (cpu.instructionStage == 2) {
        for (; currentRegIndex < 15; ++currentRegIndex) {
            if (getBit(regList, currentRegIndex)) {
                cpu.writeRegister(currentRegIndex, cpu.read32(currentAddress), CPU_MODES.USR);
                currentAddress += 4;
                return;
            }
        }
        cpu.instructionStage = 3;
    }
    if (cpu.instructionStage == 3) {
    }
}

export function STM2(cpu: ARM7CPU): void {

    if (cpu.instructionStage == 1) {
        if (!testCondition(cpu)) { }
        deduceLDMAddressing(cpu);
        regList = getBits(cpu.currentInstruction, 14, 0);
        currentRegIndex = 0;
        currentAddress = ldmStartAddr;
        cpu.instructionStage = 2;
    }

    if (cpu.instructionStage == 2) {
        for (; currentRegIndex < 15; ++currentRegIndex) {
            if (getBit(regList, currentRegIndex)) {
                cpu.write32(currentAddress, cpu.readRegister(currentRegIndex, CPU_MODES.USR))
                currentAddress += 4;
                return;
            }
        }
        cpu.instructionStage = 3;
    }
    if (cpu.instructionStage == 3) {
    }
}
var pcVal = 0;
export function LDM3(cpu: ARM7CPU): void {

    if (cpu.instructionStage == 1) {
        if (!testCondition(cpu)) { }
        deduceLDMAddressing(cpu);
        regList = getBits(cpu.currentInstruction, 15, 0);
        currentRegIndex = 0;
        currentAddress = ldmStartAddr;
        cpu.instructionStage = 2;
    }

    if (cpu.instructionStage == 2) {
        for (; currentRegIndex < 15; ++currentRegIndex) {
            if (getBit(regList, currentRegIndex)) {
                cpu.writeRegister(currentRegIndex, cpu.read32(currentAddress), CPU_MODES.USR);
                currentAddress += 4;
                return;
            }
        }
        cpu.CPSR = cpu.SPSR;
        cpu.instructionStage = 3;
        pcVal = cpu.read32(currentAddress);
        return;
    }
    if (cpu.instructionStage == 3) {
        if (cpu.isFlag(StatusFlags.THUMB_MODE)) {
            cpu.PC = pcVal & 0xFFFFFFFE;
        } else {
            cpu.PC = pcVal & 0xFFFFFFFC;
        }
    }
}

export function LDR(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceByteAddressing(cpu);
        cpu.instructionStage = 1;
    }

    if (cpu.instructionStage == 1) {
        let lastBits = u32(loadStrAddr & 0x3);
        rotateRight(cpu.read32(loadStrAddr), 8 * lastBits, cpu);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        let rd = getBits(cpu.currentInstruction, 15, 12);
        if (rd == 15) {
            cpu.PC = operand & 0xFFFFFFFE;
            cpu.setFlag(StatusFlags.THUMB_MODE, (operand & 0x1) == 1);
        } else {
            cpu.writeRegister(rd, operand);
        }
    }
}

export function STR(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceByteAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (cpu.instructionStage == 1) {

        cpu.write32(loadStrAddr, cpu.readRegister(rd));
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {

    }
}

export function STRT(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceByteAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (cpu.instructionStage == 1) {

        cpu.write32(loadStrAddr, cpu.readRegister(rd));
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {

    }
}

export function LDRT(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceByteAddressing(cpu);
        cpu.instructionStage = 1;
    }

    if (cpu.instructionStage == 1) {
        let lastBits = u32(loadStrAddr & 0x3);
        rotateRight(cpu.read32(loadStrAddr), 8 * lastBits, cpu);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        let rd = getBits(cpu.currentInstruction, 15, 12);
        if (rd == 15) {
            cpu.PC = operand;
        } else {
            cpu.writeRegister(rd, operand);
        }
    }
}

var ldrbVal: u32;
export function LDRB(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceByteAddressing(cpu);
        cpu.instructionStage = 1;
    }

    if (cpu.instructionStage == 1) {
        ldrbVal = cpu.read8(loadStrAddr);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        let rd = getBits(cpu.currentInstruction, 15, 12);
        cpu.writeRegister(rd, ldrbVal);
    }

}

export function STRB(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceByteAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (cpu.instructionStage == 1) {
        cpu.write8(loadStrAddr, cpu.readRegister(rd) & 0xff)
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
    }

}

export function STRBT(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceByteAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (cpu.instructionStage == 1) {
        cpu.write8(loadStrAddr, cpu.readRegister(rd) & 0xff)
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
    }

}

export function LDRBT(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceByteAddressing(cpu);
        cpu.instructionStage = 1;
    }

    if (cpu.instructionStage == 1) {
        ldrbVal = cpu.read8(loadStrAddr);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        let rd = getBits(cpu.currentInstruction, 15, 12);
        cpu.writeRegister(rd, ldrbVal);
    }

}



export function LDRH(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceMiscAddressing(cpu);
        cpu.instructionStage = 1;
    }

    if (cpu.instructionStage == 1) {
        ldrbVal = cpu.read16(loadStrAddr);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        let rd = getBits(cpu.currentInstruction, 15, 12);
        cpu.writeRegister(rd, ldrbVal);
    }
}

export function STRH(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceMiscAddressing(cpu);
        cpu.instructionStage = 1;
    }

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (cpu.instructionStage == 1) {
        cpu.write16(loadStrAddr, cpu.readRegister(rd) & 0xffff);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
    }
}

export function LDRSB(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceMiscAddressing(cpu);
        cpu.instructionStage = 1;
    }

    if (cpu.instructionStage == 1) {
        ldrbVal = cpu.read8(loadStrAddr);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        let rd = getBits(cpu.currentInstruction, 15, 12);
        // Sign Extend
        ldrbVal <<= 24;
        ldrbVal >>= 24;
        cpu.writeRegister(rd, ldrbVal);
    }
}

export function LDRSH(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        deduceMiscAddressing(cpu);
        cpu.instructionStage = 1;
    }

    if (cpu.instructionStage == 1) {
        ldrbVal = cpu.read16(loadStrAddr);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        let rd = getBits(cpu.currentInstruction, 15, 12);
        // Sign Extend
        ldrbVal <<= 16;
        ldrbVal >>= 16;
        cpu.writeRegister(rd, ldrbVal);
    }
}

export function SWP(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        cpu.instructionStage = 1;
    }
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let rm = getBits(cpu.currentInstruction, 3, 0);

    if (cpu.instructionStage == 1) {
        let lastBits = u32(cpu.readRegister(rn) & 0x3);
        rotateRight(cpu.read32(cpu.readRegister(rn)), 8 * lastBits, cpu);
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        cpu.write32(cpu.readRegister(rn), cpu.readRegister(rm))
        cpu.instructionStage = 3;
        return;
    }

    if (cpu.instructionStage == 3) {
        cpu.writeRegister(rd, operand);
    }
}
var swpbVal: u32;
export function SWPB(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
        cpu.instructionStage = 1;
    }
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let rm = getBits(cpu.currentInstruction, 3, 0);

    if (cpu.instructionStage == 1) {
        swpbVal = cpu.read8(cpu.readRegister(rn) & 0xff)
        cpu.instructionStage = 2;
        return;
    }

    if (cpu.instructionStage == 2) {
        cpu.write8(cpu.readRegister(rn), cpu.readRegister(rm) & 0xff)
        cpu.instructionStage = 3;
        return;
    }

    if (cpu.instructionStage == 3) {
        cpu.writeRegister(rd, swpbVal);
    }
}







