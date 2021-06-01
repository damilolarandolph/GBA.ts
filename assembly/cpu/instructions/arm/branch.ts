import { getBit, getBits } from "../../../utils/bits";
import { ARM7CPU } from "../../cpu";
import { StatusFlags } from "../../registers";
import { testCondition } from "../instructions";

export function BBL(cpu: ARM7CPU): void {
    if (!testCondition(cpu)) { }

    let instruction = cpu.currentInstruction;
    let lBit = getBit(24, instruction);
    let targetAddr = getBits(instruction, 23, 0);
    // Left align 24 bits
    targetAddr <<= 8;
    //Sign extend and shift to left by 2
    targetAddr >>= 6;
    if (lBit) {
        cpu.writeRegister(14, targetAddr);
    }
    cpu.PC = targetAddr;

}


export function BX(cpu: ARM7CPU): void {
    if (!testCondition(cpu)) { }
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    cpu.setFlag(StatusFlags.THUMB_MODE, getBit(rmVal, 0));
    cpu.PC = rmVal & 0xFFFFFFFE;

}