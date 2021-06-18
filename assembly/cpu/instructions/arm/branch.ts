import { getBit, getBits } from "../../../utils/bits";
import { ARM7CPU } from "../../cpu";
import { StatusFlags } from "../../registers";
import { testCondition } from "../instructions";

export function BBL(cpu: ARM7CPU): void {
    if (!testCondition(cpu)) {
        cpu.finish();
        return;
    }

    let instruction = cpu.currentInstruction;
    let lBit = getBit(24, instruction);
    let targetAddr: u32 = getBits(instruction, 23, 0);
    trace("Branch ADDR", 1, targetAddr);
    // Left align 24 bits
    targetAddr <<= 8;
    trace("Branch Addr Shifted", 1, targetAddr);
    //Sign extend and shift to left by 2
    targetAddr >>= 6;
    if (lBit) {
        cpu.writeRegister(14, targetAddr);
    }
    let addr: u32 = i32(cpu.readRegister(15)) + i32(targetAddr);
    trace("Branch Addr", 1, addr);
    cpu.writeRegister(15, addr);
    cpu.finish();

}


export function BX(cpu: ARM7CPU): void {
    if (!testCondition(cpu)) {
        cpu.finish();
        return;
    }
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    cpu.setFlag(StatusFlags.THUMB_MODE, getBit(rmVal, 0));
    cpu.PC = rmVal & 0xFFFFFFFE;
    cpu.finish();
}