import { getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, StatusFlags } from "../../cpu";
import { testCondition } from "../instructions";


function deduceMStates(operand: u32): u32 {
    let group1 = getBits(operand, 31, 7);
    let group2 = getBits(operand, 31, 15);
    let group3 = getBits(operand, 30, 23);

    if (group1 == 0xFFFFFF || group1 == 0) {
        return 1;
    }

    if (group2 == 0xFFFF || group2 == 0) {
        return 2;
    }

    if (group3 == 0x7F || group3 == 0) {
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
    let hiVal = u64(cpu.readRegister(rdHi));
    let loVal = u64(cpu.readRegister(rdLo));
    let rs = getBits(cpu.currentInstruction, 11, 8);
    let rsVal = u64(cpu.readRegister(rs));
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let rmVal = u64(cpu.readRegister(rm));
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.addCycles(deduceMStates(<u32>rsVal) + 2);

    let hiLo: u64 = (hiVal << 32) | loVal;
    let result: u64 = (rmVal * rsVal) + hiLo;
    cpu.writeRegister(rdHi, u32(result >>> 32));
    cpu.writeRegister(rdLo, u32(result));

    if (sBit) {
        cpu.setFlag(StatusFlags.NEGATIVE, getBit(u32(result >>> 32), 31))
        cpu.setFlag(StatusFlags.ZERO, result == 0);
    }
}

export function SMLAL(cpu: ARM7CPU): void {

    let rdHi = getBits(cpu.currentInstruction, 19, 16);
    let rdLo = getBits(cpu.currentInstruction, 15, 12);
    let hiVal = i64(cpu.readRegister(rdHi));
    let loVal = i64(cpu.readRegister(rdLo));
    let rs = getBits(cpu.currentInstruction, 11, 8);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let rsVal = i64(cpu.readRegister(rs));
    let rmVal = i64(cpu.readRegister(rm));
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.addCycles(deduceMStates(u32(rsVal)) + 2);
    // Simple Sign extension
    if ((rsVal & 0x80000000) != 0) {
        rsVal |= 0xFFFFFFFF00000000;
    }
    if ((rmVal & 0x80000000) != 0) {
        rmVal |= 0xFFFFFFFF00000000;
    }

    let hiLo: i64 = (hiVal << 32) | loVal;
    let result: i64 = (rsVal * rmVal) + hiLo;
    cpu.writeRegister(rdHi, u32(result >>> 32));
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
    let rsVal = cpu.readRegister(rs);
    let rm = getBits(cpu.currentInstruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.addCycles(deduceMStates(rsVal) + 1);
    let rs64Val = i64(rsVal);
    let rm64Val = i64(rmVal);

    // Simple Sign extension
    if ((rs64Val & 0x80000000) != 0) {
        rs64Val |= 0xFFFFFFFF00000000;
    }
    if ((rm64Val & 0x80000000) != 0) {
        rm64Val |= 0xFFFFFFFF00000000;
    }

    let result = rm64Val * rs64Val;
    cpu.writeRegister(rdHi, u32(result >>> 32));
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