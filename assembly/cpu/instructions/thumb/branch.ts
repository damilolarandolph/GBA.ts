import { getBit, getBits, signExtend } from "../../../utils/bits";
import { uAdd } from "../../../utils/math";
import { ARM7CPU, StatusFlags } from "../../cpu";
import { testCondition } from "../instructions";


export function branchConditinal(cpu: ARM7CPU) {

    if (!testCondition(cpu)) {
        cpu.addCycles(1);
        return;
    }
    let instruction = cpu.currentInstruction;
    let targetAddr: u32 = instruction & 0xff;
    // Sign Extension
    targetAddr <<= 1;
    targetAddr <<= 24;
    targetAddr = u32(<i32>targetAddr >> 24);

    // Math Magic
    let addr: u32;
    if (getBit(targetAddr, 31)) {
        // If target is negative convert it to postive value
        addr = cpu.readRegister(15) - ((~targetAddr) + 1);
    } else {
        addr = cpu.readRegister(15) + targetAddr;
    }
    cpu.writeRegister(15, addr);
}


export function branchUnconditional(cpu: ARM7CPU) {
    let instruction = cpu.currentInstruction;
    let targetAddr: u32 = instruction & 0x7FF;

    // Sign extension, you know the drill.
    targetAddr <<= 1;
    targetAddr <<= 21;
    targetAddr = u32(<i32>targetAddr >> 24);

    // Math Magic
    let addr: u32;
    if (getBit(targetAddr, 31)) {
        // If target is negative convert it to postive value
        addr = cpu.readRegister(15) - ((~targetAddr) + 1);
    } else {
        addr = cpu.readRegister(15) + targetAddr;
    }
    cpu.writeRegister(15, addr);
}


export function BLBLX(cpu: ARM7CPU) {
    let instruction = cpu.currentInstruction;
    let offset: u32 = instruction & 0x7ff;
    let hBits: u32 = (instruction >>> 11) & 0x3;

    if (hBits == 0x2) {
        offset = offset << 12;
        let pc = cpu.readRegister(15);
        cpu.writeRegister(14, uAdd(pc, signExtend(offset, 11)));
    } else if (hBits == 0x3) {
        offset = offset << 1;
        let lr = cpu.readRegister(14);
        let pc = cpu.readRegister(15);
        cpu.writeRegister(15, lr + offset);
        cpu.writeRegister(14, pc - 2);
    }
}

export function BX(cpu: ARM7CPU) {
    let instruction = cpu.currentInstruction;
    let rm = (instruction >> 3) & 0x7;
    let rmVal = cpu.readRegister(rm);
    cpu.setFlag(StatusFlags.THUMB_MODE, (rmVal & 0x1) != 0);
    cpu.writeRegister(15, rmVal & 0xFFFFFFFE);
}