import { countSetBits, getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, CPU_MODES } from "../../cpu";
import { StatusFlags } from "../../registers";
import { testCondition } from "../instructions";

//export type dataProcFunc = (instruction: u32, cpu: ARM7CPU) => [number, boolean];

export function dataProcImmediate(instruction: u32, cpu: ARM7CPU): void {
    const stage = function (cpu: ARM7CPU) {
        let immed8 = u32(getBits(instruction, 7, 0));
        let rotateAmount = u32(getBits(instruction, 11, 8));
        rotateRight(immed8, rotateAmount * 2, cpu);
    }
    cpu.enqueuePipeline(stage);
}

export function dataProcRegister(cpu: ARM7CPU): void {
    const stage = function (cpu: ARM7CPU) {
        let instruction = cpu.currentInstruction;
        let regNo = u32(getBits(instruction, 3, 0));
        let operand = cpu.readRegister(regNo);
        let carryOut = cpu.isFlag(StatusFlags.CARRY);
        cpu.enqueueData(operand);
        cpu.enqueueData(u32(carryOut));
    }

    cpu.enqueuePipeline(stage);
}

//Logical shift left with immediate
export function lsli(cpu: ARM7CPU): void {
    let stage = function () {
        let instruction = cpu.currentInstruction;
        let rm = getBits(instruction, 3, 0);
        let rmVal = cpu.readRegister(rm);
        let shiftAmount = u32(getBits(instruction, 11, 7));
        lsl(rmVal, shiftAmount, cpu);
    }

    cpu.enqueuePipeline(stage);
}


// Logical shift left with register
export function lslr(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU) {
        let instruction = cpu.currentInstruction;
        let rm = getBits(instruction, 3, 0);
        let rmVal = cpu.readRegister(rm);
        let rs = getBits(instruction, 11, 8);
        let rsVal = cpu.readRegister(rs) & 0xff;
        lsl(rmVal, rsVal, cpu);
    }

    cpu.enqueuePipeline(stage);

}

//Logical shift right with immediate
export function lsri(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU) {
        let instruction = cpu.currentInstruction;
        let rm = getBits(instruction, 3, 0);
        let rmVal = cpu.readRegister(rm);
        let shiftAmount = u32(getBits(instruction, 11, 7));
        lsr(rmVal, shiftAmount, cpu);
    }

    cpu.enqueuePipeline(stage);
}



// Logical shift right with register
export function lsrr(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU) {
        let instruction = cpu.currentInstruction;
        let rm = getBits(instruction, 3, 0);
        let rmVal = cpu.readRegister(rm);
        let rs = getBits(instruction, 11, 8);
        let rsVal = cpu.readRegister(rs) & 0xff;
        lsr(rmVal, rsVal, cpu);
    }

    cpu.enqueuePipeline(stage);

}
// Arithmetic shift right by immediate
export function asri(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU) {
        let instruction = cpu.currentInstruction;
        let rm = getBits(instruction, 3, 0);
        let rmVal = cpu.readRegister(rm);
        let shiftImm = getBits(instruction, 11, 7);
        asr(rmVal, shiftImm, cpu);
    }

    cpu.enqueuePipeline(stage);
}

//Arithmetic shift right by register
export function asrr(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rm = getBits(instruction, 3, 0);
        let rmVal = cpu.readRegister(rm);
        let rs = getBits(instruction, 11, 8);
        let rsVal = cpu.readRegister(rs);
        asr(rmVal, rsVal, cpu);
    }
    cpu.enqueuePipeline(stage);
}
// Rotate right by immediate
export function rori(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rm = getBits(instruction, 3, 0);
        let rmVal = cpu.readRegister(rm);
        let shiftImm = getBits(instruction, 11, 7);
        if (shiftImm == 0) {
            rrx(rmVal, shiftImm, cpu);
            return;
        }

        let operand = (rmVal << (31 - shiftImm)) | rmVal >> shiftImm;
        cpu.enqueueData(operand);
        cpu.enqueueData(u32(getBit(rmVal, shiftImm - 1)));
    }
    cpu.enqueuePipeline(stage);
}

// Rotate right by register
export function rorr(instruction: u32, cpu: ARM7CPU): void {
    let rm = getBits(instruction, 3, 0);
    let rmVal = cpu.readRegister(rm);
    let rs = getBits(instruction, 11, 8);
    let rsVal = cpu.readRegister(rs);

    if ((rsVal & 0xff) == 0) {
        cpu.enqueueData(rmVal);
        cpu.enqueueData(cpu.flagVal(StatusFlags.CARRY));
        return;
    }

    if ((rsVal & 0x1f) == 0) {
        cpu.enqueueData(rmVal);
        cpu.enqueueData(u32(getBit(rmVal, 31)));
        return;
    }

    let operand = (rmVal << (31 - rsVal)) | rmVal >> rsVal;
    cpu.enqueueData(operand);
    cpu.enqueueData(u32(getBit(rmVal, u32(rsVal & 0x1f) - 1)))
}

export function rrx(bits: u32, amount: number, cpu: ARM7CPU): void {
    let cFlag = cpu.isFlag(StatusFlags.CARRY) ? u32(1) : u32(0);
    let result = (cFlag << 31) | (amount >> 1);
    cpu.enqueueData(result);
    cpu.enqueueData(u32(getBit(bits, 0)));
}



// Arithmetic shift right
export function asr(bits: u32, amount: number, cpu: ARM7CPU): void {
    if (amount == 0) {
        cpu.enqueueData(bits);
        cpu.enqueueData(cpu.flagVal(StatusFlags.CARRY));
        return;
    }

    if (amount < 32) {
        let result = bits >> amount;
        let carryOut = getBit(bits, amount - 1);
        cpu.enqueueData(result);
        cpu.enqueueData(u32(carryOut));
        return;
    }

    if (!getBit(bits, 31)) {
        cpu.enqueueData(0);
        cpu.enqueueData(u32(getBit(bits, 31)));
        return;
    }
    cpu.enqueueData(0xFFFFFFFF);
    cpu.enqueueData(u32(getBit(bits, 31)));
}


//Logical shift right
export function lsr(bits: u32, amount: number, cpu: ARM7CPU): void {

    if (amount == 0) {
        cpu.enqueueData(bits);
        cpu.enqueueData(cpu.flagVal(StatusFlags.CARRY));
    }

    if (amount < 32) {
        let shiftResult = bits >>> amount
        let carryOut = getBit(bits, amount - 1);
        cpu.enqueueData(shiftResult);
        cpu.enqueueData(u32(carryOut));
        return;
    }

    if (amount == 32) {
        cpu.enqueueData(0);
        cpu.enqueueData(u32(getBit(bits, 32)))
        return;
    }

    cpu.enqueueData(0);
    cpu.enqueueData(0);
}

// Logical shift left
export function lsl(bits: u32, amount: number, cpu: ARM7CPU): void {


    if (amount == 0) {
        cpu.enqueueData(bits);
        cpu.enqueueData(cpu.flagVal(StatusFlags.CARRY));
        return;
    }

    if (amount < 32) {
        let carryout = getBit(bits, 32 - amount);
        cpu.enqueueData(bits << amount);
        cpu.enqueueData(u32(carryout));
        return;
    }

    if (amount == 32) {
        cpu.enqueueData(0);
        cpu.enqueueData(u32(getBit(bits, 0)));
        return;
    }
    cpu.enqueueData(0);
    cpu.enqueueData(0);
}

export function rotateRight(bits: u32, amount: number, cpu: ARM7CPU): void {
    let result = (bits << (31 - amount)) | bits >> amount;

    if (amount == 0) {
        cpu.enqueueData(result);
        cpu.enqueueData(u32(false));
        return;
    }

    cpu.enqueueData(result);
    cpu.enqueueData(u32(getBit(result, 32)))
    return;
}

export function immedOffRegAddr(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let rnVal = cpu.readRegister(rn);
        let offset12 = getBits(instruction, 11, 0);
        if (getBit(instruction, 23)) {
            cpu.enqueueData(rnVal + offset12)
        } else {
            cpu.enqueueData(rnVal - offset12)
        }
    }

    cpu.enqueuePipeline(stage);
}

export function regOffRegAddr(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let rnVal = cpu.readRegister(rn);
        let rm = getBits(instruction, 3, 0);
        let rmVal = cpu.readRegister(rm);
        if (getBit(instruction, 23)) {
            cpu.enqueueData(rnVal + rmVal);
        } else {
            cpu.enqueueData(rnVal - rmVal);
        }
    }
    cpu.enqueuePipeline(stage);
}

export function scaledRegOff(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let shift = getBits(instruction, 6, 5);
        let rnVal = cpu.readRegister(rn);

        switch (shift) {
            case 0b00:
                lsli(cpu);
            case 0b01:
                lsri(cpu);
            case 0b10:
                asri(cpu);
            case 0b11:
                rori(cpu);
        }
        cpu.dequeueData();
        let index: u32 = cpu.dequeueData();
        if (getBit(instruction, 23)) {
            cpu.enqueueData(rnVal + index);
        } else {
            cpu.enqueueData(rnVal - index);
        }
    }

    cpu.enqueuePipeline(stage);
}

export function immedPreIndexed(cpu: ARM7CPU): void {
    let stage = function () {
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
        cpu.enqueueData(address);
    }

    cpu.enqueuePipeline(stage);
}


export function immedPostIndexed(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
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
        cpu.enqueueData(rnVal);
    }

    cpu.enqueuePipeline(stage);
}


export function regOffPostIndexed(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU) {
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

        cpu.enqueueData(rnVal);

    }
    cpu.enqueuePipeline(stage);
}

export function regOffPreIndexed(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU) {
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
        cpu.enqueueData(address);
    }

    cpu.enqueuePipeline(stage);
}




export function scaledRegOffPreIndex(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU) {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let shift = getBits(instruction, 6, 5);
        let rnVal = cpu.readRegister(rn);

        switch (shift) {
            case 0b00:
                lsli(cpu);
            case 0b01:
                lsri(cpu);
            case 0b10:
                asri(cpu);
            case 0b11:
                rori(cpu);
        }
        cpu.dequeueData();
        let index = cpu.dequeueData();
        let address: u32;
        if (getBit(instruction, 23)) {
            address = rnVal + index;
        } else {
            address = rnVal - index;
        }

        if (testCondition(cpu)) {
            cpu.writeRegister(rn, address);
        }

        cpu.enqueueData(address);
    }

    cpu.enqueuePipeline(stage);

}

export function scaledRegOffPostIndex(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let shift = getBits(instruction, 6, 5);
        let rnVal = cpu.readRegister(rn);

        switch (shift) {
            case 0b00:
                lsli(cpu);
            case 0b01:
                lsri(cpu);
            case 0b10:
                asri(cpu);
            case 0b11:
                rori(cpu);
        }
        cpu.dequeueData();
        let index = cpu.dequeueData();
        if (testCondition(cpu)) {
            if (getBit(instruction, 23)) {
                cpu.writeRegister(rn, rnVal + index);
            } else {
                cpu.writeRegister(rn, rnVal - index);
            }
        }

        cpu.enqueueData(rnVal);
    }
    cpu.enqueuePipeline(stage);
}

export function miscImmedOffset(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let rnVal = cpu.readRegister(rn);
        let offset8 = (getBits(instruction, 11, 8) << 4) | getBits(instruction, 3, 0);

        if (getBit(instruction, 23)) {
            cpu.enqueueData(rnVal + offset8);
        } else {
            cpu.enqueueData(rnVal - offset8);
        }
    }

    cpu.enqueuePipeline(stage);
}
export function miscImmedOffsetPreIndexed(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
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

        cpu.enqueueData(address);
    }
    cpu.enqueuePipeline(stage);
}

export function miscImmedOffsetPostIndexed(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
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
        cpu.enqueueData(rnVal);

    }

    cpu.enqueuePipeline(stage);
}

export function ldmIncrAfter(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let rnVal = cpu.readRegister(rn);
        let registerList = getBits(instruction, 15, 0);
        let startAddress = rnVal;
        let endAddress = rnVal + (countSetBits(registerList) * 4) - 4

        if (testCondition(cpu) && getBit(instruction, 21)) {
            cpu.writeRegister(rn, endAddress + 4);
        }
        cpu.enqueueData(startAddress);
        cpu.enqueueData(endAddress);
    }

    cpu.enqueuePipeline(stage);
}

export function ldmIncrBefore(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let rnVal = cpu.readRegister(rn);
        let registerList = getBits(instruction, 15, 0);
        let startAddress = rnVal + 4;
        let endAddress = rnVal + (countSetBits(registerList) * 4)
        if (testCondition(cpu) && getBit(instruction, 21)) {
            cpu.writeRegister(rn, endAddress);
        }
        cpu.enqueueData(startAddress);
        cpu.enqueueData(endAddress);
    }
    cpu.enqueuePipeline(stage);
}

export function ldmDecrAfter(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let rnVal = cpu.readRegister(rn);
        let registerList = getBits(instruction, 15, 0);
        let startAddress = rnVal - (countSetBits(registerList) * 4) + 4
        let endAddress = rnVal;
        if (testCondition(cpu) && getBit(instruction, 21)) {
            cpu.writeRegister(rn, startAddress - 4);
        }
        cpu.enqueueData(startAddress);
        cpu.enqueueData(endAddress);
    }
    cpu.enqueuePipeline(stage)
}

export function ldmDecrBefor(cpu: ARM7CPU): void {
    let stage = function (cpu: ARM7CPU): void {
        let instruction = cpu.currentInstruction;
        let rn = getBits(instruction, 19, 16);
        let rnVal = cpu.readRegister(rn);
        let registerList = getBits(instruction, 15, 0);
        let startAddress = rnVal - (countSetBits(registerList) * 4);
        let endAddress = rnVal - 4;
        if (testCondition(cpu) && getBit(instruction, 21)) {
            cpu.writeRegister(rn, startAddress);
        }
        cpu.enqueueData(startAddress);
        cpu.enqueueData(endAddress);
    }
    cpu.enqueuePipeline(stage);
}