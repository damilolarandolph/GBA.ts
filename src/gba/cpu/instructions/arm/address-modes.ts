import { countSetBits, getBit, getBits } from "../../../utils/bits";
import { uint32 } from "../../../utils/types";
import { ARM7CPU } from "../../cpu";
import { StatusFlags } from "../../registers";
import { testCondition } from "../instructions";

export type dataProcFunc = (instruction: uint32, cpu: ARM7CPU) => [number, boolean];

export function dataProcImmediate(instruction: uint32, cpu: ARM7CPU): [number, boolean] {
    let immed8 = uint32(getBits(instruction, 7, 0));
    let rotateAmount = uint32(getBits(instruction, 11, 8));
    let result = rotateRight(immed8, rotateAmount * 2, cpu);
    return result;
}

export function dataProcRegister(instruction: uint32, cpu: ARM7CPU): [number, boolean] {
    let regNo = uint32(getBits(instruction, 3, 0));
    let operand = cpu.readRegister(regNo);
    let carryOut = cpu.CPSR.getFlag(StatusFlags.CARRY);

    return [operand, carryOut];
}

//Logical shift left with immediate
export function lsli(instruction: uint32, cpu: ARM7CPU): [number, boolean] {
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftAmount = uint32(getBits(instruction, 11, 7));
    return lsl(rmVal, shiftAmount, cpu);
}


// Logical shift left with register
export function lslr(instruction: uint32, cpu: ARM7CPU): [number, boolean] {

    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs) & 0xff;
    return lsl(rmVal, rsVal, cpu);

}

//Logical shift right with immediate
export function lsri(instruction: uint32, cpu: ARM7CPU): [number, boolean] {
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftAmount = uint32(getBits(instruction, 11, 7));
    return lsr(rmVal, shiftAmount, cpu);
}



// Logical shift right with register
export function lsrr(instruction: uint32, cpu: ARM7CPU): [number, boolean] {

    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs) & 0xff;
    return lsr(rmVal, rsVal, cpu);

}
// Arithmetic shift right by immediate
export function asri(instruction: uint32, cpu: ARM7CPU): [number, boolean] {
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftImm = getBits(instruction, 11, 7);
    return asr(rmVal, shiftImm, cpu);
}

//Arithmetic shift right by register
export function asrr(instruction: uint32, cpu: ARM7CPU): [number, boolean] {
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs);
    return asr(rmVal, rsVal, cpu);
}
// Rotate right by immediate
export function rori(instruction: uint32, cpu: ARM7CPU): [number, boolean] {

    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftImm = getBits(instruction, 11, 7);
    if (shiftImm == 0) {
        return rrx(rmVal, shiftImm, cpu);
    }

    let operand = (rmVal << (31 - shiftImm)) | rmVal >> shiftImm;
    return [operand, getBit(rmVal, shiftImm - 1)];

}

// Rotate right by register
export function rorr(instruction: uint32, cpu: ARM7CPU): [number, boolean] {
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs);

    if ((rsVal & 0xff) == 0) {
        return [rmVal, cpu.CPSR.getFlag(StatusFlags.CARRY)]
    }

    if ((rsVal & 0x1f) == 0) {
        return [rmVal, getBit(rmVal, 31)];
    }

    let operand = (rmVal << (31 - rsVal)) | rmVal >> rsVal;
    return [operand, getBit(rmVal, uint32(rsVal & 0x1f) - 1)]
}

export function rrx(bits: uint32, amount: number, cpu: ARM7CPU): [number, boolean] {
    let cFlag = cpu.CPSR.getFlag(StatusFlags.CARRY) ? uint32(1) : uint32(0);
    let result = (cFlag << 31) | (amount >> 1);
    return [result, getBit(bits, 0)];
}



// Arithmetic shift right
export function asr(bits: uint32, amount: number, cpu: ARM7CPU): [number, boolean] {
    if (amount == 0) {
        return [bits, cpu.CPSR.getFlag(StatusFlags.CARRY)];
    }

    if (amount < 32) {
        let result = bits >> amount;
        let carryOut = getBit(bits, amount - 1);
        return [result, carryOut];
    }

    if (!getBit(bits, 31)) {
        return [0, getBit(bits, 31)];
    }

    return [0xFFFFFFFF, getBit(bits, 31)];
}


//Logical shift right
export function lsr(bits: uint32, amount: number, cpu: ARM7CPU): [number, boolean] {

    if (amount == 0) {
        return [bits, cpu.CPSR.getFlag(StatusFlags.CARRY)];
    }

    if (amount < 32) {
        let shiftResult = bits >>> amount
        let carryOut = getBit(bits, amount - 1);
        return [shiftResult, carryOut];
    }

    if (amount == 32) {
        return [0, getBit(bits, 31)];
    }

    return [0, false];

}

// Logical shift left
export function lsl(bits: uint32, amount: number, cpu: ARM7CPU): [number, boolean] {


    if (amount == 0) {
        return [bits, cpu.CPSR.getFlag(StatusFlags.CARRY)];
    }

    if (amount < 32) {
        let carryout = getBit(bits, 32 - amount);
        return [bits << amount, carryout];
    }

    if (amount == 32) {
        return [0, getBit(bits, 0)];
    }

    return [0, false];
}

export function rotateRight(bits: uint32, amount: number, cpu: ARM7CPU): [number, boolean] {
    let result = (bits << (31 - amount)) | bits >> amount;

    if (amount == 0)
        return [result, false];

    return [result, getBit(result, 31)];
}

export function postAddressingFunc() { }
export function preAddressingFunc() { }
export function immedOffRegAddr(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset12 = getBits(instruction, 11, 0);
    if (getBit(instruction, 23)) {
        return rnVal + offset12;
    } else {
        return rnVal - offset12;
    }
}

export function regOffRegAddr(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    if (getBit(instruction, 23)) {
        return rnVal + rmVal;
    } else {
        return rnVal - rmVal;
    }
}

export function scaledRegOff(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);
    let index!: number;

    switch (shift) {
        case 0b00:
            [index] = lsli(instruction, cpu);
        case 0b01:
            [index] = lsri(instruction, cpu);
        case 0b10:
            [index] = asri(instruction, cpu);
        case 0b11:
            [index] = rori(instruction, cpu);
    }
    if (getBit(instruction, 23)) {
        return rnVal + index;
    } else {
        return rnVal - index;
    }

}

export function immedPreIndexed(cpu: ARM7CPU): uint32 {

    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset12 = getBits(instruction, 11, 0);
    let address;
    if (getBit(instruction, 23)) {
        address = rnVal + offset12;
    } else {
        address = rnVal - offset12;
    }
    if (testCondition(cpu)) {
        cpu.writeRegister(rn, address);
    }
    return address;
}


export function immedPostIndexed(cpu: ARM7CPU): uint32 {

    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset12 = getBits(instruction, 11, 0);

    if (testCondition(cpu)) {
        if (getBit(instruction, 23)) {
            cpu.writeRegister(rn, rnVal + offset12);
        } else {
            cpu.writeRegister(rn, rnVal - offset12);
        }
    }
    return rnVal;
}


export function regOffPostIndexed(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    if (testCondition(cpu)) {
        if (getBit(instruction, 23)) {
            cpu.writeRegister(rn, rnVal + rmVal);
        } else {
            cpu.writeRegister(rn, rnVal - rmVal);
        }
    }

    return rnVal;
}

export function regOffPreIndexed(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let address;
    if (getBit(instruction, 23)) {
        address = rnVal + rmVal;
    } else {
        address = rnVal - rmVal;
    }
    if (testCondition(cpu)) {
        cpu.writeRegister(rn, address);
    }
    return address;
}




export function scaledRegOffPreIndex(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);
    let index!: number;

    switch (shift) {
        case 0b00:
            [index] = lsli(instruction, cpu);
        case 0b01:
            [index] = lsri(instruction, cpu);
        case 0b10:
            [index] = asri(instruction, cpu);
        case 0b11:
            [index] = rori(instruction, cpu);
    }
    let address;
    if (getBit(instruction, 23)) {
        address = rnVal + index;
    } else {
        address = rnVal - index;
    }

    if (testCondition(cpu)) {
        cpu.writeRegister(rn, address);
    }

    return address;

}

export function scaledRegOffPostIndex(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);
    let index!: number;

    switch (shift) {
        case 0b00:
            [index] = lsli(instruction, cpu);
        case 0b01:
            [index] = lsri(instruction, cpu);
        case 0b10:
            [index] = asri(instruction, cpu);
        case 0b11:
            [index] = rori(instruction, cpu);
    }

    if (testCondition(cpu)) {
        if (getBit(instruction, 23)) {
            cpu.writeRegister(rn, rnVal + index);
        } else {
            cpu.writeRegister(rn, rnVal - index);
        }
    }

    return rnVal;
}

export function miscImmedOffset(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset8 = (getBits(instruction, 11, 8) << 4) | getBits(instruction, 3, 0);

    if (getBit(instruction, 23)) {
        return rnVal + offset8;
    } else {
        return rnVal - offset8;
    }
}
export function miscImmedOffsetPreIndexed(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset8 = (getBits(instruction, 11, 8) << 4) | getBits(instruction, 3, 0);
    let address;
    if (getBit(instruction, 23)) {
        address = rnVal + offset8;
    } else {
        address = rnVal - offset8;
    }

    if (testCondition(cpu)) {
        cpu.writeRegister(rn, address);
    }

    return address;
}

export function miscImmedOffsetPostIndexed(cpu: ARM7CPU): uint32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset8 = (getBits(instruction, 11, 8) << 4) | getBits(instruction, 3, 0);
    if (testCondition(cpu)) {
        if (getBit(instruction, 23)) {
            cpu.writeRegister(rn, rnVal + offset8);
        } else {
            cpu.writeRegister(rn, rnVal - offset8);
        }
    }
    return rnVal;
}

export function ldmIncrAfter(cpu: ARM7CPU): [uint32, uint32] {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal;
    let endAddress = rnVal + (countSetBits(registerList) * 4) - 4

    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, endAddress + 4);
    }

    return [startAddress, endAddress];
}

export function ldmIncrBefore(cpu: ARM7CPU): [uint32, uint32] {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal + 4;
    let endAddress = rnVal + (countSetBits(registerList) * 4)
    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, endAddress);
    }

    return [startAddress, endAddress];
}

export function ldmDecrAfter(cpu: ARM7CPU): [uint32, uint32] {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal - (countSetBits(registerList) * 4) + 4
    let endAddress = rnVal;
    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, startAddress - 4);
    }
    return [startAddress, endAddress];
}

export function ldmDecrBefor(cpu: ARM7CPU): [uint32, uint32] {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal - (countSetBits(registerList) * 4);
    let endAddress = rnVal - 4;
    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, startAddress);
    }
    return [startAddress, endAddress];
}