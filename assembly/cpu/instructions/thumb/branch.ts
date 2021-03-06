import { signExtend } from "../../../utils/bits";
import { uAdd } from "../../../utils/math";
import { ARM7CPU, StatusFlags } from "../../cpu";
import { testCondition } from "../instructions";


export function BC(cpu: ARM7CPU): void {

    if (!testCondition(cpu)) {
        cpu.addCycles(1);
        return;
    }
    let instruction = cpu.currentInstruction;
    let targetAddr: u32 = instruction & 0xff;
    // Sign Extension
    targetAddr = signExtend(targetAddr, 8);
    targetAddr = targetAddr << 1;

    // Math Magic
    let addr: u32 = uAdd(cpu.readRegister(15), targetAddr);
    cpu.writeRegister(15, addr);
}


export function B(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let targetAddr: u32 = instruction & 0x7FF;

    // Sign extension, you know the drill.
    targetAddr = signExtend(targetAddr, 11);
    targetAddr = targetAddr << 1;

    // Math Magic
    let addr: u32;
    addr = uAdd(cpu.readRegister(15), targetAddr);
    cpu.writeRegister(15, addr);
}


export function BLBLX(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let offset: u32 = instruction & 0x7ff;
    let hBits: u32 = (instruction >>> 11) & 0x3;

    if (hBits == 0b10) {
        let pc = cpu.readRegister(15);
        cpu.writeRegister(14, uAdd(pc, (signExtend(offset, 11) << 12)));
    } else if (hBits == 0b11) {
        offset = offset << 1;
        let lr = cpu.readRegister(14);
        let pc = cpu.readRegister(15);
        cpu.writeRegister(15, lr + offset);
        cpu.writeRegister(14, (pc - u32(2)) | 1);
    }
}

export function BX(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let h2Bit = (instruction >>> 6) & 0x1;
    let rm = (h2Bit << 3) | ((instruction >> 3) & 0x7);
    let rmVal = cpu.readRegister(rm);
    // trace("BX ADDR", 2, rm, rmVal);
    cpu.cpsr.thumb = (rmVal & 0x1) != 0;
    cpu.writeRegister(15, rmVal & 0xFFFFFFFE);
}