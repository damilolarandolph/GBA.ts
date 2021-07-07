import { getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, StatusFlags } from "../../cpu";
import { testCondition } from "../instructions";


function deduceMStates(operand: u32): u32 {
    let group1 = getBits(operand, 31, 7);
    let group2 = getBits(operand, 31, 15);
    let group3 = getBits(operand, 30, 23);

    if (group1 == 0x1FFFFFF || group1 == 0) {
        return 1;
    }

    if (group2 == 0x1FFFF || group2 == 0) {
        return 2;
    }

    if (group3 == 0xFF || group3 == 0) {
        return 3;
    }

    return 4;
}

export function MLA(cpu: ARM7CPU): void {


    let rd = getBits(cpu.currentInstruction, 19, 16);
    let rn = getBits(cpu.currentInstruction, 15, 12);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let rs = getBits(cpu.currentInstruction, 11, 8);

    cpu.addCycles(deduceMStates(cpu.readRegister(rs)) + 1);

    let result = (cpu.readRegister(rm) * cpu.readRegister(rs)) + cpu.readRegister(rn);
    cpu.writeRegister(rd, result);

    if (getBit(cpu.currentInstruction, 20)) {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
    }
}

export function MUL(cpu: ARM7CPU): void {


    let rd = getBits(cpu.currentInstruction, 19, 16);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let rs = getBits(cpu.currentInstruction, 11, 8);

    cpu.addCycles(deduceMStates(cpu.readRegister(rs)));

    let result = (cpu.readRegister(rm) * cpu.readRegister(rs));
    cpu.writeRegister(rd, result);

    if (getBit(cpu.currentInstruction, 20)) {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(result, 31));
        cpu.setFlag(StatusFlags.ZERO, result == 0);
    }
}

export function UMLAL(cpu: ARM7CPU): void {

    let rdHi = getBits(cpu.currentInstruction, 19, 16);
    let rdLo = getBits(cpu.currentInstruction, 15, 12);
    let rs = getBits(cpu.currentInstruction, 11, 8);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.addCycles(deduceMStates(cpu.readRegister(rs)) + 2);

    let hiLo: u64 = u64((u64(rdHi) << 32) | (u64(rdLo)));
    let result: u64 = (u64(cpu.readRegister(rm)) * u64(cpu.readRegister(rs))) + hiLo;
    cpu.writeRegister(rdHi, u32(result >> 32));
    cpu.writeRegister(rdLo, u32(result));

    if (sBit) {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(u32(result >> 32), 31))
        cpu.setFlag(StatusFlags.ZERO, result == 0);
    }
}

export function SMLAL(cpu: ARM7CPU): void {

    let rdHi = getBits(cpu.currentInstruction, 19, 16);
    let rdLo = getBits(cpu.currentInstruction, 15, 12);
    let rs = getBits(cpu.currentInstruction, 11, 8);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.addCycles(deduceMStates(cpu.readRegister(rs)) + 2);

    let hiLo: i64 = i64((u64(rdHi) << 32) | (u64(rdLo)));
    let result: i64 = (i64(cpu.readRegister(rm)) * i64(cpu.readRegister(rs))) + hiLo;
    cpu.writeRegister(rdHi, u32(result >> 32));
    cpu.writeRegister(rdLo, u32(result));

    if (sBit) {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(u32(result >> 32), 31))
        cpu.setFlag(StatusFlags.ZERO, result == 0);
    }
}

export function SMLUL(cpu: ARM7CPU): void {

    let rdHi = getBits(cpu.currentInstruction, 19, 16);
    let rdLo = getBits(cpu.currentInstruction, 15, 12);
    let rs = getBits(cpu.currentInstruction, 11, 8);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.addCycles(deduceMStates(cpu.readRegister(rs)) + 1);

    let result: i64 = (i64(cpu.readRegister(rm)) * i64(cpu.readRegister(rs)));
    cpu.writeRegister(rdHi, u32(result >> 32));
    cpu.writeRegister(rdLo, u32(result));

    if (sBit) {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(u32(result >> 32), 31))
        cpu.setFlag(StatusFlags.ZERO, result == 0);
    }
}

export function UMULL(cpu: ARM7CPU): void {

    let rdHi = getBits(cpu.currentInstruction, 19, 16);
    let rdLo = getBits(cpu.currentInstruction, 15, 12);
    let rs = getBits(cpu.currentInstruction, 11, 8);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.addCycles(deduceMStates(cpu.readRegister(rs)) + 1);

    let result: u64 = (u64(cpu.readRegister(rm)) * u64(cpu.readRegister(rs)));
    cpu.writeRegister(rdHi, u32(result >> 32));
    cpu.writeRegister(rdLo, u32(result));

    if (sBit) {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(u32(result >> 32), 31))
        cpu.setFlag(StatusFlags.ZERO, result == 0);
    }
}