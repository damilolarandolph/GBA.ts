import { Timing } from "../../../memory/timings-map";
import { countSetBits, getBit, signExtend } from "../../../utils/bits";
import { ARM7CPU } from "../../cpu";




@unmanaged class FormatResult {
    op1: u32;
    op2: u32;
    destination: u32;
}

const formatResult: FormatResult = { op1: 0, op2: 0, destination: 0 };

function deduceFormat(cpu: ARM7CPU): FormatResult {
    let instruction = cpu.currentInstruction;

    if ((instruction >>> 11) == 0b01001) {
        formatResult.destination = (instruction >>> 8) & 0x7;
        formatResult.op1 = (cpu.readRegister(15)) & (~u32(2));
        formatResult.op2 = (instruction & 0xff) << 2;
    }
    else if ((instruction >>> 12) == 0b0101) {
        formatResult.destination = instruction & 0x7;
        let rB = (instruction >>> 3) & 0x7;
        let rO = (instruction >>> 6) & 0x7;
        formatResult.op1 = cpu.readRegister(rB);
        formatResult.op2 = cpu.readRegister(rO);
    }

    else if ((instruction >>> 13) == 0b011) {
        let shift = getBit(instruction, 12) ? 2 : 0;
        let rB = (instruction >>> 3) & 0x7;
        let offset = (instruction >>> 6) & 0x1f;
        offset = offset << shift;
        formatResult.op1 = cpu.readRegister(rB);
        formatResult.op2 = offset;
        formatResult.destination = instruction & 0x7;
    }

    else if ((instruction >>> 12) == 0b1000) {
        let rB = (instruction >>> 3) & 0x7;
        let offset = (instruction >>> 6) & 0x1f;
        offset = offset << 1;
        formatResult.op1 = cpu.readRegister(rB);
        formatResult.op2 = offset;
        formatResult.destination = instruction & 0x7;
    }

    else if ((instruction >>> 12) == 0b1001) {
        formatResult.destination = (instruction >>> 8) & 0x7;
        formatResult.op1 = cpu.readRegister(13);
        formatResult.op2 = (instruction & 0xff) << 2;
    } else {
        throw new Error("UNKNOWN THUMB LOAD FORMAT");
    }

    return formatResult;


}

export function LDR(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    trace("TLDR");
    cpu.addCycles(1);
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    let address = format.op1 + format.op2
    cpu.writeRegister(format.destination, cpu.read32(address));
}

export function LDRH(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    cpu.addCycles(1);
    let address = format.op1 + format.op2;
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.writeRegister(format.destination, u32(cpu.read16(address)));
}

export function LDRB(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    cpu.addCycles(1);
    let address = format.op1 + format.op2;
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.writeRegister(format.destination, cpu.read8(address));
}

export function LDRSH(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    cpu.addCycles(1);
    let address = format.op1 + format.op2;
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.writeRegister(format.destination, signExtend(cpu.read16(address), 16));
}

export function LDRSB(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    cpu.addCycles(1);
    let address = format.op1 + format.op2;
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;

    cpu.writeRegister(format.destination, signExtend(cpu.read8(address), 8));
}



export function STR(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let address: u32 = format.op1 + format.op2;
    cpu.prefetch();
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.write32(address, cpu.readRegister(format.destination));
}

export function STRH(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let address = format.op1 + format.op2;
    cpu.prefetch();
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.write16(address, u16(cpu.readRegister(format.destination) & 0xffff));
}

export function STRB(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let address = format.op1 + format.op2;
    cpu.prefetch();
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.write8(address, u8(cpu.readRegister(format.destination) & 0xff));
}


export function LDMIA(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = (instruction >>> 8) & 0x7;
    let regList = instruction & 0xff;
    let startAddr = cpu.readRegister(rn);
    let endAddr = startAddr + (countSetBits(regList) * 4) - 4;
    let addr = startAddr;

    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    for (let reg = 0; reg < 8; ++reg) {
        if (getBit(regList, reg)) {
            cpu.writeRegister(reg, cpu.read32(addr));
            addr += 4;
            cpu.accessType = Timing.Access.SEQUENTIAL;
        }
    }

    assert(endAddr == addr - 4);
    cpu.writeRegister(rn, endAddr + 4);

}

export function POP(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let startAddr = cpu.readRegister(13);
    let rBit = (instruction >>> 8) & 0x1;
    let regList = instruction & 0xff;
    let endAddr = startAddr + 4 * (rBit + countSetBits(regList));
    let addr = startAddr;
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;

    for (let reg = 0; reg < 8; ++reg) {
        if (getBit(regList, reg)) {
            cpu.writeRegister(reg, cpu.read32(addr));
            addr += 4;
            cpu.accessType = Timing.Access.SEQUENTIAL;
        }
    }

    if (rBit != 0) {
        let value = cpu.read32(addr);
        cpu.writeRegister(15, value & 0xFFFFFFFE);
        addr += 4;
    }

    assert(endAddr == addr);
    cpu.writeRegister(13, endAddr);

}

export function PUSH(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rBit = (instruction >>> 8) & 0x1;
    let regList = instruction & 0xff;
    let sp = cpu.readRegister(13)
    let startAddr = sp - 4 * (rBit + countSetBits(regList));
    let endAddr = sp - 4;
    let addr = startAddr;
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    for (let reg = 0; reg < 8; ++reg) {
        if (getBit(regList, reg)) {
            cpu.write32(addr, cpu.readRegister(reg));
            addr += 4;
            cpu.accessType = Timing.Access.SEQUENTIAL;
        }
    }

    if (rBit != 0) {
        cpu.write32(addr, cpu.readRegister(14));
        addr += 4;
    }

    assert(endAddr == (addr - 4));
    cpu.writeRegister(13, startAddr);
}


export function STMIA(cpu: ARM7CPU): void {
    let instruction = cpu.currentInstruction;
    let rn = (instruction >>> 8) & 0x7;
    let regList = instruction & 0xff;
    let startAddr = cpu.readRegister(rn);
    let endAddr = startAddr + (countSetBits(regList) * 4) - 4;
    let addr = startAddr;
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    for (let reg = 0; reg < 8; ++reg) {
        if (getBit(regList, reg)) {
            cpu.write32(addr, cpu.readRegister(reg));
            addr += 4;
            cpu.accessType = Timing.Access.SEQUENTIAL;
        }
    }

    assert(endAddr == (addr - 4));
    cpu.writeRegister(rn, endAddr + 4);
}

