import { countSetBits, getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, CPU_MODES, StatusFlags } from "../../cpu";

import { testCondition } from "../instructions";

//export type dataProcFunc = (instruction: u32, cpu: ARM7CPU) => [number, boolean];

// @ts-ignore: decorator
@global
export var operand: u32 = 0;

// @ts-ignore: decorator
@global
export var shifterOut: u32 = 0;
export function dataProcImmediate(instruction: u32, cpu: ARM7CPU): void {
    let immed8 = u32(getBits(instruction, 7, 0));
    let rotateAmount = u32(getBits(instruction, 11, 8));
    rotateRight(immed8, rotateAmount * 2, cpu);
} 0xFFFFFFFC

export function dataProcRegister(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let regNo = u32(getBits(instruction, 3, 0));
    operand = cpu.readRegister(regNo);
    shifterOut = cpu.flagVal(StatusFlags.CARRY);
}

//Logical shift left with immediate
export function lsli(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftAmount = u32(getBits(instruction, 11, 7));
    lsl(rmVal, shiftAmount, cpu);

}


// Logical shift left with register
export function lslr(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs) & 0xff;
    lsl(rmVal, rsVal, cpu);


}

//Logical shift right with immediate
export function lsri(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftAmount = u32(getBits(instruction, 11, 7));
    lsr(rmVal, shiftAmount, cpu);
}



// Logical shift right with register
export function lsrr(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs) & 0xff;
    lsr(rmVal, rsVal, cpu);


}
// Arithmetic shift right by immediate
export function asri(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftImm = getBits(instruction, 11, 7);
    asr(rmVal, shiftImm, cpu);
}

//Arithmetic shift right by register
export function asrr(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs);
    asr(rmVal, rsVal, cpu);
}
// Rotate right by immediate
export function rori(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftImm = getBits(instruction, 11, 7);
    if (shiftImm == 0) {
        rrx(rmVal, shiftImm, cpu);
        return;
    }

    operand = (rmVal << (32 - shiftImm)) | rmVal >> shiftImm;
    shifterOut = u32(getBit(rmVal, shiftImm - 1));
}

// Rotate right by register
export function rorr(instruction: u32, cpu: ARM7CPU): void {
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs);

    if ((rsVal & 0xff) == 0) {
        operand = rmVal;
        shifterOut = cpu.flagVal(StatusFlags.CARRY);
        return;
    }

    if ((rsVal & 0x1f) == 0) {
        operand = rmVal;
        shifterOut = u32(getBit(rmVal, 31));
        return;
    }

    operand = (rmVal << (32 - rsVal)) | rmVal >> rsVal;
    shifterOut = u32(getBit(rmVal, u32(rsVal & 0x1f) - 1));
}

export function rrx(bits: u32, amount: u32, cpu: ARM7CPU): void {
    let cFlag = cpu.isFlag(StatusFlags.CARRY) ? u32(1) : u32(0);
    let result = u32(cFlag << 31) | (amount >> 1);
    operand = result;
    shifterOut = u32(getBit(bits, 0));
}



// Arithmetic shift right
export function asr(bits: u32, amount: u32, cpu: ARM7CPU): void {
    if (amount == 0) {
        operand = bits;
        shifterOut = cpu.flagVal(StatusFlags.CARRY);
        return;
    }

    if (amount < 32) {
        let result = bits >> <u32>amount;
        let carryOut = getBit(bits, amount - 1);
        operand = result;
        shifterOut = u32(carryOut);
        return;
    }

    if (!getBit(bits, 31)) {
        operand = 0;
        shifterOut = u32(getBit(bits, 31));
        return;
    }
    operand = 0xFFFFFFFF;
    shifterOut = u32(getBit(bits, 31));
}


//Logical shift right
export function lsr(bits: u32, amount: u32, cpu: ARM7CPU): void {

    if (amount == 0) {
        operand = bits;
        shifterOut = cpu.flagVal(StatusFlags.CARRY);
    }

    if (amount < 32) {
        let shiftResult = bits >>> <u32>amount
        let carryOut = getBit(bits, <u32>amount - 1);
        operand = shiftResult;
        shifterOut = u32(carryOut);
        return;
    }

    if (amount == 32) {
        operand = 0;
        shifterOut = u32(getBit(bits, 32));
        return;
    }
    operand = 0;
    shifterOut = 0;
}

// Logical shift left
export function lsl(bits: u32, amount: u32, cpu: ARM7CPU): void {


    if (amount == 0) {
        operand = bits;
        shifterOut = cpu.flagVal(StatusFlags.CARRY);
        return;
    }

    if (amount < 32) {
        let carryout = getBit(bits, u32(32 - amount));
        operand = bits << <u32>amount;
        shifterOut = u32(carryout);
        return;
    }

    if (amount == 32) {
        operand = 0;
        shifterOut = u32(getBit(bits, 0));
        return;
    }
    operand = 0;
    shifterOut = 0;
}

export function rotateRight(bits: u32, amount: u32, cpu: ARM7CPU): void {
    let result = (bits << u32(32 - amount)) | bits >>> u32(amount);

    if (amount == 0) {
        operand = result;
        shifterOut = 0;
        return;
    }
    operand = result;
    shifterOut = u32(getBit(result, 32))
    return;
}
export var loadStrAddr: u32 = 0;
export function immedOffRegAddr(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset12 = getBits(instruction, 11, 0);
    if (getBit(instruction, 23)) {
        loadStrAddr = rnVal + offset12
    } else {
        loadStrAddr = rnVal - offset12
    }

}

export function regOffRegAddr(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    if (getBit(instruction, 23)) {
        loadStrAddr = rnVal + rmVal;
    } else {
        loadStrAddr = rnVal - rmVal;
    }
}

export function scaledRegOff(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);

    switch (shift) {
        case 0b00:
            lsli(cpu);
            break;
        case 0b01:
            lsri(cpu);
            break;
        case 0b10:
            asri(cpu);
            break;
        case 0b11:
            rori(cpu);
            break;
    }
    if (getBit(instruction, 23)) {
        loadStrAddr = rnVal + operand;
    } else {
        loadStrAddr = rnVal - operand;
    }

}

export function immedPreIndexed(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset12 = getBits(instruction, 11, 0);
    let address: u32;
    if (getBit(instruction, 23)) {
        address = rnVal + offset12;
    } else {
        address = rnVal - offset12;
    }
    if (testCondition(cpu)) {
        cpu.writeRegister(rn, address);
    }
    loadStrAddr = address;
}


export function immedPostIndexed(cpu: ARM7CPU): void {
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
    loadStrAddr = rnVal;
}


export function regOffPostIndexed(cpu: ARM7CPU): void {
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
    loadStrAddr = rnVal;

}

export function regOffPreIndexed(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let address: u32;
    if (getBit(instruction, 23)) {
        address = rnVal + rmVal;
    } else {
        address = rnVal - rmVal;
    }
    if (testCondition(cpu)) {
        cpu.writeRegister(rn, address);
    }
    loadStrAddr = address;
}




export function scaledRegOffPreIndex(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);

    switch (shift) {
        case 0b00:
            lsli(cpu);
            break;
        case 0b01:
            lsri(cpu);
            break;
        case 0b10:
            asri(cpu);
            break;
        case 0b11:
            rori(cpu);
            break;
    }
    let address: u32;
    if (getBit(instruction, 23)) {
        address = rnVal + operand;
    } else {
        address = rnVal - operand;
    }

    if (testCondition(cpu)) {
        cpu.writeRegister(rn, address);
    }
    loadStrAddr = address;
}

export function scaledRegOffPostIndex(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);

    switch (shift) {
        case 0b00:
            lsli(cpu);
            break;
        case 0b01:
            lsri(cpu);
            break;
        case 0b10:
            asri(cpu);
            break;
        case 0b11:
            rori(cpu);
            break;
    }
    if (testCondition(cpu)) {
        if (getBit(instruction, 23)) {
            cpu.writeRegister(rn, rnVal + operand);
        } else {
            cpu.writeRegister(rn, rnVal - operand);
        }
    }
    loadStrAddr = rnVal;
}

export function miscImmedOffset(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset8 = (getBits(instruction, 11, 8) << 4) | getBits(instruction, 3, 0);

    if (getBit(instruction, 23)) {
        loadStrAddr = rnVal + offset8;
    } else {
        loadStrAddr = rnVal - offset8;
    }

}
export function miscImmedOffsetPreIndexed(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset8 = (getBits(instruction, 11, 8) << 4) | getBits(instruction, 3, 0);
    let address: u32;
    if (getBit(instruction, 23)) {
        address = rnVal + offset8;
    } else {
        address = rnVal - offset8;
    }

    if (testCondition(cpu)) {
        cpu.writeRegister(rn, address);
    }

    loadStrAddr = address;
}

export function miscImmedOffsetPostIndexed(cpu: ARM7CPU): void {
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
    loadStrAddr = rnVal;
}

export var ldmStartAddr: u32 = 0;
export var ldmEndAddr: u32 = 0;

export function ldmIncrAfter(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal;
    let endAddress = rnVal + (countSetBits(registerList) * 4) - 4

    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, endAddress + 4);
    }
    ldmStartAddr = startAddress;
    ldmEndAddr = endAddress;

}

export function ldmIncrBefore(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal + 4;
    let endAddress = rnVal + (countSetBits(registerList) * 4)
    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, endAddress);
    }
    ldmStartAddr = startAddress;
    ldmEndAddr = endAddress;
}

export function ldmDecrAfter(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal - (countSetBits(registerList) * 4) + 4
    let endAddress = rnVal;
    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, startAddress - 4);
    }
    ldmStartAddr = startAddress;
    ldmEndAddr = endAddress;
}

export function ldmDecrBefor(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal - (countSetBits(registerList) * 4);
    let endAddress = rnVal - 4;
    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, startAddress);
    }
    ldmStartAddr = startAddress;
    ldmEndAddr = endAddress;
}