import { Timing } from "../../../memory/timings-map";
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

    if (!pBit) {
        if (immBit) {
            return miscImmedOffsetPostIndexed(cpu);
        } else {
            return regOffPostIndexed(cpu);
        }
    } else {
        if (wBit) {
            if (immBit) {
                return miscImmedOffsetPreIndexed(cpu);
            } else {
                return regOffPreIndexed(cpu);
            }
        } else {
            if (immBit) {
                return miscImmedOffset(cpu);
            } else {
                return regOffRegAddr(cpu);
            }
        }
    }
}


export function LDM(cpu: ARM7CPU): void {
    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 15, 0);

    cpu.addCycles(1);
    let currentAddress = multiAddrOutput.startAddress;
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {
            let readValue = cpu.read32(currentAddress);
            cpu.writeRegister(index, readValue);
            currentAddress += 4;
        }
    }

    if (getBit(regList, 15)) {

        cpu.writeRegister(15, cpu.read32(currentAddress) & 0xFFFFFFFC);
        currentAddress += 4;
    }
    assert(multiAddrOutput.endAddress == currentAddress - 4);
}
export function STM(cpu: ARM7CPU): void {
    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 15, 0);
    let currentAddress = multiAddrOutput.startAddress;
    let lowest = 20;

    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {
            let regValue = cpu.readRegister(index);
            if (index == multiAddrOutput.rn && i32(multiAddrOutput.rn) < lowest) {
                regValue = multiAddrOutput.orginalRn;
            }
            cpu.write32(currentAddress & (~u32(3)), regValue);
            currentAddress += 4;
            if (lowest > index) {
                lowest = index;
            }
        }
    }

    assert(multiAddrOutput.endAddress == currentAddress - 4);
}

export function LDM2(cpu: ARM7CPU): void {

    if (getBit(cpu.currentInstruction, 15)) { LDM3(cpu); return }

    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 14, 0);

    let currentAddress = multiAddrOutput.startAddress;
    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {
            cpu.writeRegister(index, cpu.read32(currentAddress), CPU_MODES.USR);
            currentAddress += 4;
        }

    }

    assert(multiAddrOutput.endAddress == currentAddress - 4);
}

export function STM2(cpu: ARM7CPU): void {

    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 14, 0);
    let currentAddress = multiAddrOutput.startAddress;

    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {
            let rnVal = cpu.readRegister(index, CPU_MODES.USR);
            cpu.write32(currentAddress, rnVal)
            currentAddress += 4;
        }
    }

    assert((currentAddress - 4) == multiAddrOutput.endAddress, "STM Addressing fail");
}
export function LDM3(cpu: ARM7CPU): void {


    let multiAddrOutput = deduceLDMAddressing(cpu);
    let regList = getBits(cpu.currentInstruction, 15, 0);

    let currentAddress = multiAddrOutput.startAddress;
    for (let index = 0; index < 15; ++index) {
        if (getBit(regList, index)) {
            cpu.writeRegister(index, cpu.read32(currentAddress), CPU_MODES.USR);
            currentAddress += 4;
        }
    }
    cpu.cpsr.val = cpu.spsr.val;
    let pcVal = cpu.read32(currentAddress);
    if (cpu.cpsr.thumb) {
        cpu.writeRegister(15, pcVal & 0xFFFFFFFE);
    } else {
        cpu.writeRegister(15, pcVal & 0xFFFFFFFC);
    }
}

export function LDR(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    let lastBits = u32(addr & 0x3);
    let alignedAddr = addr & (~u32(3));
    let data = cpu.read32(alignedAddr);
    cpu.addCycles(1);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;

    let shifterOutput = rotateRight(data, 8 * lastBits, cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (rd == 15) {
        cpu.writeRegister(15, shifterOutput.operand & 0xFFFFFFFE);
        cpu.cpsr.thumb = (shifterOutput.operand & 0x1) != 0;
    } else {
        cpu.writeRegister(rd, shifterOutput.operand);
    }

}

export function STR(cpu: ARM7CPU): void {
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let addr = deduceByteAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rdValue = cpu.readRegister(rd);
    if (addr >= 0x02000000 && addr <= 0x0203FFFF) {
        trace("WRAM WRITE", 2, addr, rdValue);
    }
    cpu.write32(addr, rdValue);
}

export function STRT(cpu: ARM7CPU): void {
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let addr = deduceByteAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.write32(addr, cpu.readRegister(rd));
}

export function LDRT(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    let lastBits = u32(addr & 0x3);
    cpu.addCycles(1);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let shifterOutput = rotateRight(cpu.read32(addr), 8 * lastBits, cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (rd == 15) {
        cpu.writeRegister(15, shifterOutput.operand);
    } else {
        cpu.writeRegister(rd, shifterOutput.operand);
    }
}

export function LDRB(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    cpu.addCycles(1);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let readValue = cpu.read8(addr);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.writeRegister(rd, readValue);
}

export function STRB(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.write8(addr, u8(cpu.readRegister(rd) & 0xff))
}

export function STRBT(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.write8(addr, u8(cpu.readRegister(rd) & 0xff))
}

export function LDRBT(cpu: ARM7CPU): void {
    let addr = deduceByteAddressing(cpu);
    cpu.addCycles(1);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let ldrbVal = cpu.read8(addr);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.writeRegister(rd, ldrbVal);
}



export function LDRH(cpu: ARM7CPU): void {
    let addr = deduceMiscAddressing(cpu);
    cpu.addCycles(1);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let ldrbVal = cpu.read16(addr);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    cpu.writeRegister(rd, ldrbVal);
}

export function STRH(cpu: ARM7CPU): void {
    let addr = deduceMiscAddressing(cpu);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rdVal: u16 = u16(cpu.readRegister(rd) & 0xffff);
    // trace("STRHVAL", 1, rdVal);
    //trace("STRHVAL ADDR", 1, addr);
    cpu.write16(addr, rdVal);
}

export function LDRSB(cpu: ARM7CPU): void {
    let addr = deduceMiscAddressing(cpu);
    cpu.addCycles(1);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let ldrbVal: u32 = cpu.read8(addr);
    let rd = getBits(cpu.currentInstruction, 15, 12);

    // Sign Extend
    ldrbVal <<= 24;
    ldrbVal = u32(<i32>ldrbVal >> 24);
    cpu.writeRegister(rd, ldrbVal);
}

export function LDRSH(cpu: ARM7CPU): void {
    let addr = deduceMiscAddressing(cpu);
    cpu.addCycles(1);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let ldrbVal: u32 = cpu.read16(addr);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    // trace("LDRBVAL", 1, ldrbVal);
    //  trace("LDRBVAL ADDR", 1, addr);

    // Sign Extend
    ldrbVal <<= 16;
    ldrbVal = u32(<i32>ldrbVal >> 16);
    //trace("LDRBVAL2", 1, ldrbVal);
    cpu.writeRegister(rd, ldrbVal);
}

export function SWP(cpu: ARM7CPU): void {
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let address = cpu.readRegister(rn);
    let alignedAddr = address & (~u32(3));
    let lastBits = u32(address & 0x3);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let shifterOut = rotateRight(cpu.read32(alignedAddr), 8 * lastBits, cpu);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.write32(alignedAddr, cpu.readRegister(rm))
    cpu.addCycles(1);
    cpu.writeRegister(rd, shifterOut.operand);
}
export function SWPB(cpu: ARM7CPU): void {
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let rm = getBits(cpu.currentInstruction, 3, 0);

    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let swpbVal = cpu.read8(cpu.readRegister(rn));
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.write8(cpu.readRegister(rn), u8(cpu.readRegister(rm) & 0xff))
    cpu.addCycles(1);
    cpu.writeRegister(rd, swpbVal);
}







