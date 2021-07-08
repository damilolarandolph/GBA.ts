import { countSetBits, getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, CPU_MODES, StatusFlags } from "../../cpu";

import { testCondition } from "../instructions";

@unmanaged class ShifterOutput {
    operand: u32;
    shifterOut: u32;
}

export { ShifterOutput };
//export type dataProcFunc = (instruction: u32, cpu: ARM7CPU) => [number, boolean];

export function dataProcImmediate(instruction: u32, cpu: ARM7CPU): ShifterOutput {
    let immed8 = u32(getBits(instruction, 7, 0));
    let rotateAmount = u32(getBits(instruction, 11, 8));
    return rotateRight(immed8, rotateAmount * 2, cpu);
} 0xFFFFFFFC

export function dataProcRegister(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let regNo = u32(getBits(instruction, 3, 0));
    let output: ShifterOutput = {
        operand: cpu.readRegister(regNo),
        shifterOut: cpu.flagVal(StatusFlags.CARRY)
    }
    return output;
}

//Logical shift left with immediate
export function lsli(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftAmount = u32(getBits(instruction, 11, 7));
    return lsl(rmVal, shiftAmount, cpu);
}


// Logical shift left with register
export function lslr(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs) & 0xff;
    return lsl(rmVal, rsVal, cpu);
}

//Logical shift right with immediate
export function lsri(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftAmount = u32(getBits(instruction, 11, 7));
    return lsr(rmVal, shiftAmount, cpu);
}



// Logical shift right with register
export function lsrr(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs) & 0xff;
    return lsr(rmVal, rsVal, cpu);
}
// Arithmetic shift right by immediate
export function asri(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftImm = getBits(instruction, 11, 7);
    return asr(rmVal, shiftImm, cpu);
}

//Arithmetic shift right by register
export function asrr(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs);
    return asr(rmVal, rsVal, cpu);
}
// Rotate right by immediate
export function rori(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftImm = getBits(instruction, 11, 7);
    if (shiftImm == 0) {
        return rrx(rmVal, shiftImm, cpu);
    }

    let operand = (rmVal << (32 - shiftImm)) | rmVal >> shiftImm;
    let shifterOut = u32(getBit(rmVal, shiftImm - 1));
    let output: ShifterOutput = { operand: operand, shifterOut: shifterOut };
    return output;
}

// Rotate right by register
export function rorr(instruction: u32, cpu: ARM7CPU): ShifterOutput {
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs);

    if ((rsVal & 0xff) == 0) {
        let operand = rmVal;
        let shifterOut = cpu.flagVal(StatusFlags.CARRY);
        return { operand, shifterOut };
    }

    if ((rsVal & 0x1f) == 0) {
        let operand = rmVal;
        let shifterOut = u32(getBit(rmVal, 31));
        return { operand, shifterOut }
    }

    let operand = (rmVal << (32 - rsVal)) | rmVal >> rsVal;
    let shifterOut = u32(getBit(rmVal, u32(rsVal & 0x1f) - 1));
    return { operand, shifterOut };

}

export function rrx(bits: u32, amount: u32, cpu: ARM7CPU): ShifterOutput {
    let cFlag = cpu.isFlag(StatusFlags.CARRY) ? u32(1) : u32(0);
    let result = u32(cFlag << 31) | (amount >> 1);
    let operand = result;
    let shifterOut = u32(getBit(bits, 0));
    return { operand, shifterOut };
}



// Arithmetic shift right
export function asr(bits: u32, amount: u32, cpu: ARM7CPU): ShifterOutput {
    if (amount == 0) {
        let operand = bits;
        let shifterOut = cpu.flagVal(StatusFlags.CARRY);
        return { operand, shifterOut };
    }

    if (amount < 32) {
        let result = u32(<i32>bits >> <i32>amount);
        let carryOut = getBit(bits, amount - 1);
        let operand = result;
        let shifterOut = u32(carryOut);
        return { operand, shifterOut };
    }

    if (!getBit(bits, 31)) {
        let operand = 0;
        let shifterOut = u32(getBit(bits, 31));
        return { operand, shifterOut };
    }
    let operand = 0xFFFFFFFF;
    let shifterOut = u32(getBit(bits, 31));
    return { operand, shifterOut };
}


//Logical shift right
export function lsr(bits: u32, amount: u32, cpu: ARM7CPU): ShifterOutput {
    let operand: u32;
    let shifterOut: u32;
    if (amount == 0) {
        operand = bits;
        shifterOut = cpu.flagVal(StatusFlags.CARRY);
        return { operand, shifterOut };
    }

    if (amount < 32) {
        let shiftResult = bits >>> u32(amount)
        let carryOut = getBit(bits, u32(amount) - 1);
        operand = shiftResult;
        shifterOut = u32(carryOut);
        return { operand, shifterOut };
    }

    if (amount == 32) {
        operand = 0;
        shifterOut = u32(getBit(bits, 32));
        return { operand, shifterOut };
    }
    return { operand: 0, shifterOut: 0 }
}

// Logical shift left
export function lsl(bits: u32, amount: u32, cpu: ARM7CPU): ShifterOutput {

    let operand: u32;
    let shifterOut: u32;

    if (amount == 0) {
        operand = bits;
        shifterOut = cpu.flagVal(StatusFlags.CARRY);
        return { operand, shifterOut };
    }

    if (amount < 32) {
        let carryout = getBit(bits, u32(32 - amount));
        operand = bits << u32(amount);
        shifterOut = u32(carryout);
        return { operand, shifterOut };
    }

    if (amount == 32) {
        operand = 0;
        shifterOut = u32(getBit(bits, 0));
        return { operand, shifterOut };
    }
    return { operand: 0, shifterOut: 0 }
}

export function rotateRight(bits: u32, amount: u32, cpu: ARM7CPU): ShifterOutput {
    let result = (bits << u32(32 - amount)) | bits >>> u32(amount);
    let operand: u32;
    let shifterOut: u32;

    if (amount == 0) {
        operand = result;
        shifterOut = cpu.flagVal(StatusFlags.CARRY);
        return { operand, shifterOut };
    }
    operand = result;
    shifterOut = u32(getBit(result, 31))
    return { operand, shifterOut };
}


export function immedOffRegAddr(cpu: ARM7CPU): u32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset12 = getBits(instruction, 11, 0);
    if (getBit(instruction, 23)) {
        return rnVal + offset12
    } else {
        return rnVal - offset12
    }

}

export function regOffRegAddr(cpu: ARM7CPU): u32 {
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

export function scaledRegOff(cpu: ARM7CPU): u32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);
    let operand: u32 = 0;

    switch (shift) {
        case 0b00:
            operand = lsli(cpu).operand;
            break;
        case 0b01:
            operand = lsri(cpu).operand;
            break;
        case 0b10:
            operand = asri(cpu).operand;
            break;
        case 0b11:
            operand = rori(cpu).operand;
            break;
    }
    if (getBit(instruction, 23)) {
        return rnVal + operand;
    } else {
        return rnVal - operand;
    }

}

export function immedPreIndexed(cpu: ARM7CPU): u32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let offset12 = getBits(instruction, 11, 0);
    let address: u32 = 0;
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


export function immedPostIndexed(cpu: ARM7CPU): u32 {
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


export function regOffPostIndexed(cpu: ARM7CPU): u32 {
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

export function regOffPreIndexed(cpu: ARM7CPU): u32 {
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

    return address;
}





export function scaledRegOffPreIndex(cpu: ARM7CPU): u32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);
    let operand: u32 = 0;

    switch (shift) {
        case 0b00:
            operand = lsli(cpu).operand;
            break;
        case 0b01:
            operand = lsri(cpu).operand;
            break;
        case 0b10:
            operand = asri(cpu).operand;
            break;
        case 0b11:
            operand = rori(cpu).operand;
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
    return address;
}

export function scaledRegOffPostIndex(cpu: ARM7CPU): u32 {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let shift = getBits(instruction, 6, 5);
    let rnVal = cpu.readRegister(rn);
    let operand: u32 = 0;

    switch (shift) {
        case 0b00:
            operand = lsli(cpu).operand;
            break;
        case 0b01:
            operand = lsri(cpu).operand;
            break;
        case 0b10:
            operand = asri(cpu).operand;
            break;
        case 0b11:
            operand = rori(cpu).operand;
            break;
    }
    if (testCondition(cpu)) {
        if (getBit(instruction, 23)) {
            cpu.writeRegister(rn, rnVal + operand);
        } else {
            cpu.writeRegister(rn, rnVal - operand);
        }
    }
    return rnVal;
}

export function miscImmedOffset(cpu: ARM7CPU): u32 {
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
export function miscImmedOffsetPreIndexed(cpu: ARM7CPU): u32 {
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

    return address;
}

export function miscImmedOffsetPostIndexed(cpu: ARM7CPU): u32 {
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


@unmanaged class MultipleAddrOutput {
    startAddress: u32;
    endAddress: u32;
}

export { MultipleAddrOutput };


export function ldmIncrAfter(cpu: ARM7CPU): MultipleAddrOutput {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal;
    let endAddress = rnVal + (countSetBits(registerList) * 4) - 4

    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, endAddress + 4);
    }

    return { startAddress, endAddress };
}

export function ldmIncrBefore(cpu: ARM7CPU): MultipleAddrOutput {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal + 4;
    let endAddress = rnVal + (countSetBits(registerList) * 4)
    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, endAddress);
    }

    return { startAddress, endAddress }
}

export function ldmDecrAfter(cpu: ARM7CPU): MultipleAddrOutput {
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal - (countSetBits(registerList) * 4) + 4
    let endAddress = rnVal;
    if (testCondition(cpu) && getBit(instruction, 21)) {
        cpu.writeRegister(rn, startAddress - 4);
    }

    return { startAddress, endAddress }
}

export function ldmDecrBefor(cpu: ARM7CPU): MultipleAddrOutput {

    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let registerList = getBits(instruction, 15, 0);
    let startAddress = rnVal - (countSetBits(registerList) * 4);
    let endAddress = rnVal - 4;


    if (testCondition(cpu) && getBit(instruction, 21)) {

        cpu.writeRegister(rn, startAddress);
    }

    return { startAddress, endAddress }
}