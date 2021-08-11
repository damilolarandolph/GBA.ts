import { countSetBits, getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, CPU_MODES, StatusFlags } from "../../cpu";

import { testCondition } from "../instructions";

@unmanaged class ShifterOutput {
    operand: u32;
    shifterOut: u32;
}

const output: ShifterOutput = { operand: 0, shifterOut: 0 };

export { ShifterOutput };
//export type dataProcFunc = (instruction: u32, cpu: ARM7CPU) => [number, boolean];

export function dataProcImmediate(instruction: u32, cpu: ARM7CPU): ShifterOutput {
    let immed8 = u32(getBits(instruction, 7, 0));
    let rotateAmount = u32(getBits(instruction, 11, 8));
    return rotateRight(immed8, rotateAmount * 2, cpu);
}

export function dataProcRegister(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let regNo = u32(getBits(instruction, 3, 0));
    let output: ShifterOutput = {
        operand: cpu.readRegister(regNo),
        shifterOut: cpu.cpsr.c ? 1 : 0
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
    return lsr(rmVal, shiftAmount, true, cpu);
}



// Logical shift right with register
export function lsrr(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs) & 0xff;
    return lsr(rmVal, rsVal, false, cpu);
}
// Arithmetic shift right by immediate
export function asri(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let shiftImm = getBits(instruction, 11, 7);
    return asr(rmVal, shiftImm, true, cpu);
}

//Arithmetic shift right by register
export function asrr(cpu: ARM7CPU): ShifterOutput {
    let instruction = cpu.currentInstruction;
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs);
    return asr(rmVal, rsVal, false, cpu);
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
    output.operand = operand;
    output.shifterOut = shifterOut;
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
        let shifterOut = cpu.cpsr.c ? 1 : 0;
        output.operand = operand;
        output.shifterOut = shifterOut;
    }

    else if ((rsVal & 0x1f) == 0) {
        let operand = rmVal;
        let shifterOut = u32(getBit(rmVal, 31));
        output.operand = operand;
        output.shifterOut = shifterOut;
    } else {
        let operand = (rmVal << (32 - rsVal)) | rmVal >> rsVal;
        let shifterOut = u32(getBit(rmVal, u32(rsVal & 0x1f) - 1));
        output.operand = operand;
        output.shifterOut = shifterOut;
    }
    return output;

}

export function rrx(bits: u32, amount: u32, cpu: ARM7CPU): ShifterOutput {
    let cFlag = cpu.cpsr.c ? u32(1) : u32(0);
    let result = u32(cFlag << 31) | (amount >> 1);
    output.operand = result;
    output.shifterOut = u32(getBit(bits, 0));
    return output;
}



// Arithmetic shift right
export function asr(bits: u32, amount: u32, immediate: boolean, cpu: ARM7CPU): ShifterOutput {

    if (amount == 0 && immediate) {
        amount = 32;
    }
    let amountTrunc: u32 = amount &= 0xff;
    if (amountTrunc == 0) {
        output.operand = bits;
        output.shifterOut = u32(cpu.cpsr.c);
    }

    else if (amountTrunc < 32) {
        let result = u32(<i32>bits >> amountTrunc);
        let carryOut = getBit(bits, amountTrunc - 1);
        output.operand = result;
        output.shifterOut = u32(carryOut);
    }

    else if (!getBit(bits, 31)) {
        output.operand = 0;
        output.shifterOut = getBit(bits, 31) ? 1 : 0;
    } else {
        output.operand = 0xFFFFFFFF;
        output.shifterOut = getBit(bits, 31) ? 1 : 0;
    }
    return output;
}


//Logical shift right
export function lsr(bits: u32, amount: u32, isImmediate: boolean, cpu: ARM7CPU): ShifterOutput {

    if (isImmediate) {
        if (amount == 0) {
            output.operand = 0
            output.shifterOut = u32(getBit(bits, 31));
        } else {

            output.operand = bits >>> amount;
            output.shifterOut = u32(getBit(bits, amount - 1))

        }

        return output;
    }

    let amountTrunc = amount & 0xff;

    if (amountTrunc == 0) {
        output.operand = bits;
        output.shifterOut = u32(cpu.cpsr.c);
    }

    else if (amountTrunc < 32) {
        let shiftResult = bits >>> amountTrunc
        let carryOut = getBit(bits, u32(amountTrunc) - 1);
        output.operand = shiftResult;
        output.shifterOut = u32(carryOut);
    }

    else if (amountTrunc == 32) {
        output.operand = 0;
        output.shifterOut = u32(getBit(bits, 31));
    } else {
        output.operand = output.shifterOut = 0;
    }
    return output;
}

// Logical shift left
export function lsl(bits: u32, amount: u32, cpu: ARM7CPU): ShifterOutput {
    let amountTrunc = amount & 0xff;

    if (amountTrunc == 0) {
        output.operand = bits;
        output.shifterOut = u32(cpu.cpsr.c);
    } else if (amountTrunc < 32) {
        let carryout = getBit(bits, u32(32 - amountTrunc));
        output.operand = bits << u32(amountTrunc);
        output.shifterOut = u32(carryout);
    } else if (amountTrunc == 32) {
        output.operand = 0;
        output.shifterOut = u32((bits & 0x1) != 0);
    } else {
        output.operand = output.shifterOut = 0;
    }
    return output;
}

export function rotateRight(bits: u32, amount: u32, cpu: ARM7CPU): ShifterOutput {
    let result = (bits << u32(32 - amount)) | bits >>> u32(amount);

    if (amount == 0) {
        output.operand = result;
        output.shifterOut = u32(cpu.cpsr.c);
    } else {
        output.operand = result;
        output.shifterOut = u32(getBit(result, 31))
    }
    return output;
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

const multiOutput: MultipleAddrOutput = { startAddress: 0, endAddress: 0 };

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

    multiOutput.startAddress = startAddress;
    multiOutput.endAddress = endAddress;
    return multiOutput;
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
    multiOutput.startAddress = startAddress;
    multiOutput.endAddress = endAddress;
    return multiOutput;
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

    multiOutput.startAddress = startAddress;
    multiOutput.endAddress = endAddress;
    return multiOutput;
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

    multiOutput.startAddress = startAddress;
    multiOutput.endAddress = endAddress;
    return multiOutput;
}