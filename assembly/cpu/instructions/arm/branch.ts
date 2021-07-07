import { getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, StatusFlags } from "../../cpu";
import { testCondition } from "../instructions";

export function BBL(cpu: ARM7CPU): void {

    let instruction = cpu.currentInstruction;
    let lBit = getBit(instruction, 24);
    let targetAddr: u32 = getBits(instruction, 23, 0);
    // Left align 24 bits
    targetAddr <<= 8;
    //Sign extend and shift to left by 2
    targetAddr = u32(<i32>targetAddr >> 6);

    //  trace("Branch Instruction", 1, instruction);
    // trace("Lbit", 1, lBit ? 1 : 0);
    if (lBit) {
        cpu.writeRegister(14, cpu.PC - 4);
        //    trace("Branch Instruction", 1, instruction);
    }
    let addr: u32;
    if (getBit(targetAddr, 31)) {
        addr = cpu.readRegister(15) - ((~targetAddr) + 1);
    } else {
        addr = cpu.readRegister(15) + targetAddr;
    }

    cpu.writeRegister(15, addr);

}


export function BX(cpu: ARM7CPU): void {
    trace("HELLO");
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    cpu.setFlag(StatusFlags.THUMB_MODE, getBit(rmVal, 0));
    cpu.writeRegister(15, rmVal & 0xFFFFFFFE)
}