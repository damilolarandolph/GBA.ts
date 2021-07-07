import { getBit, getBits, setBit } from "../../../utils/bits";
import { ARM7CPU, CPU_MODES, StatusFlags } from "../../cpu";
import { testCondition } from "../instructions";
import { immedOffRegAddr, immedPostIndexed, immedPreIndexed, ldmDecrAfter, ldmDecrBefor, ldmIncrAfter, ldmIncrBefore, miscImmedOffset, miscImmedOffsetPostIndexed, miscImmedOffsetPreIndexed, MultipleAddrOutput, regOffPostIndexed, regOffPreIndexed, regOffRegAddr, rotateRight, scaledRegOff, scaledRegOffPostIndex, scaledRegOffPreIndex } from "./address-modes";

export function deduceLDMAddressing(cpu: ARM7CPU): MultipleAddrOutput {
    let currentInstuction = cpu.currentInstruction;
    let pBit = getBit(currentInstuction, 24);
    let uBit = getBit(currentInstuction, 23);
    if (pBit && uBit) {
        return ldmIncrBefore(cpu);
    }
    else if (!pBit && uBit) {
        return ldmIncrAfter(cpu);
    }
    else if (pBit && !uBit) {
        return ldmDecrBefor(cpu);
    }
    else {
        return ldmDecrAfter(cpu);
    }

}

export function deduceByteAddressing(cpu: ARM7CPU): u32 {
    let currentInstruction = cpu.currentInstruction;
    let immBit = getBit(currentInstruction, 25);
    let pBit = getBit(currentInstruction, 24);
    let wBit = getBit(currentInstruction, 21);


    if (!pBit) {
        if (!immBit) {
            return immedPostIndexed(cpu);
        } else {
            return scaledRegOffPostIndex(cpu);
        }
    } else {
        if (!wBit) {
            if (!immBit) {
                return immedOffRegAddr(cpu);
            } else {
                return scaledRegOff(cpu);
            }
        } else {
            if (!immBit) {
                return immedPreIndexed(cpu);
            } else {
                return scaledRegOffPreIndex(cpu);
            }
        }
    }
}

export function deduceMiscAddressing(cpu: ARM7CPU): u32 {
    let currentInstruction = cpu.currentInstruction;
    let pBit = getBit(currentInstruction, 24);
    let wBit = getBit(currentInstruction, 21);
    let immBit = getBit(currentInstruction, 22);

    if (!wBit) {
        if (immBit)
            return miscImmedOffset(cpu);
        else
            return regOffRegAddr(cpu);
    } else if (pBit) {
        if (immBit)
            return miscImmedOffsetPreIndexed(cpu);
        else
            return regOffPreIndexed(cpu);
    } else {
        if (immBit)
            return miscImmedOffsetPostIndexed(cpu);
        else
            return regOffPostIndexed(cpu);
    }
}

export function LDM(cpu: ARM7CPU): void {
    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 15, 0);

    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {
            let currentAddr = multiAddrOutput.startAddress + (index * 4);
            cpu.writeRegister(index, cpu.read32(currentAddr));
        }
    }

    if (getBit(regList, 15)) {
        cpu.PC = cpu.read32(multiAddrOutput.startAddress + 60);
    }
}
export function STM(cpu: ARM7CPU): void {
    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 15, 0);

    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {
            let currentAddr = multiAddrOutput.startAddress + (index * 4);
            cpu.write32(currentAddr, cpu.readRegister(index));
        }
    }
}

export function LDM2(cpu: ARM7CPU): void {

    if (getBit(cpu.currentInstruction, 15)) { LDM3(cpu); return }

    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 14, 0);

    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {
            let currentAddr = multiAddrOutput.startAddress + (index * 4);
            cpu.writeRegister(index, cpu.read32(currentAddr), CPU_MODES.USR);
        }
    }
}

export function STM2(cpu: ARM7CPU): void {

    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 14, 0);
    trace("Addr multiple", 2, multiAddrOutput.startAddress, multiAddrOutput.endAddress);
    for (let index = 0; index < 15; ++index) {
        if ((regList & 0x1) != 0) {
            let currentAddr = multiAddrOutput.startAddress + (index * 4);
            trace("Curr addr", 1, currentAddr);
            cpu.write32(currentAddr, cpu.readRegister(index, CPU_MODES.USR))
        }

        regList >>>= 1;
    }
}
export function LDM3(cpu: ARM7CPU): void {


    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 15, 0);

    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {

            let currentAddr = multiAddrOutput.startAddress + (index * 4);
            cpu.writeRegister(index, cpu.read32(currentAddr), CPU_MODES.USR);
        }
    }
    cpu.CPSR = cpu.SPSR;
    let pcVal = cpu.read32(multiAddrOutput.startAddress + 60);
    if (cpu.isFlag(StatusFlags.THUMB_MODE)) {
        cpu.PC = pcVal & 0xFFFFFFFE;
    } else {
        cpu.PC = pcVal & 0xFFFFFFFC;
    }
}

export function LDR(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);

    let lastBits = u32(addr & 0x3);
    let shifterOutput = rotateRight(cpu.read32(addr), 8 * lastBits, cpu);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (rd == 15) {
        cpu.PC = shifterOutput.operand & 0xFFFFFFFE;
        cpu.setFlag(StatusFlags.THUMB_MODE, (shifterOutput.operand & 0x1) == 1);
    } else {
        cpu.writeRegister(rd, shifterOutput.operand);
    }

}

export function STR(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.write32(addr, cpu.readRegister(rd));
}

export function STRT(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.write32(addr, cpu.readRegister(rd));
}

export function LDRT(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);

    let lastBits = u32(addr & 0x3);
    let shifterOutput = rotateRight(cpu.read32(addr), 8 * lastBits, cpu);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (rd == 15) {
        cpu.PC = shifterOutput.operand;
    } else {
        cpu.writeRegister(rd, shifterOutput.operand);
    }
}

export function LDRB(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    let readValue = cpu.read8(addr);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.writeRegister(rd, readValue);
}

export function STRB(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.write8(addr, u8(cpu.readRegister(rd) & 0xff))
}

export function STRBT(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.write8(addr, u8(cpu.readRegister(rd) & 0xff))
}

export function LDRBT(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    let ldrbVal = cpu.read8(addr);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.writeRegister(rd, ldrbVal);
}



export function LDRH(cpu: ARM7CPU): void {
    let addr = deduceMiscAddressing(cpu);
    let ldrbVal = cpu.read16(addr);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.writeRegister(rd, ldrbVal);
}

export function STRH(cpu: ARM7CPU): void {
    let addr = deduceMiscAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.write16(addr, u16(cpu.readRegister(rd) & 0xffff));
}

export function LDRSB(cpu: ARM7CPU): void {
    let addr = deduceMiscAddressing(cpu);

    let ldrbVal: u32 = cpu.read8(addr);
    let rd = getBits(cpu.currentInstruction, 15, 12);

    // Sign Extend
    ldrbVal <<= 24;
    ldrbVal = u32(<i32>ldrbVal >> 24);
    cpu.writeRegister(rd, ldrbVal);
}

export function LDRSH(cpu: ARM7CPU): void {
    let addr = deduceMiscAddressing(cpu);
    let ldrbVal: u32 = cpu.read16(addr);

    let rd = getBits(cpu.currentInstruction, 15, 12);

    // Sign Extend
    ldrbVal <<= 16;
    ldrbVal = u32(<i32>ldrbVal >> 16);
    cpu.writeRegister(rd, ldrbVal);
}

export function SWP(cpu: ARM7CPU): void {
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let rm = getBits(cpu.currentInstruction, 3, 0);

    let lastBits = u32(cpu.readRegister(rn) & 0x3);
    let shifterOut = rotateRight(cpu.read32(cpu.readRegister(rn)), 8 * lastBits, cpu);
    cpu.write32(cpu.readRegister(rn), cpu.readRegister(rm))
    cpu.writeRegister(rd, shifterOut.operand);
}
export function SWPB(cpu: ARM7CPU): void {
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let rm = getBits(cpu.currentInstruction, 3, 0);

    let swpbVal = cpu.read8(cpu.readRegister(rn) & 0xff)

    cpu.write8(cpu.readRegister(rn), u8(cpu.readRegister(rm) & 0xff))

    cpu.writeRegister(rd, swpbVal);
}







