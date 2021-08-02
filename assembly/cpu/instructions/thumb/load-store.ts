import { Timing } from "../../../memory/timings-map";
import { signExtend } from "../../../utils/bits";
import { ARM7CPU } from "../../cpu";


@unmanaged class FormatResult {

}




export function LDR(cpu: ARM7CPU): void {
    let destination: u32 = 0;
    let address: u32 = 0;
    let instruction = cpu.currentInstruction;

    cpu.addCycles(1);
    if ((instruction >>> 11) == 0b01101) {
        let rn = (instruction >>> 3) & 0x7;
        let immed5 = (instruction >>> 6) & 0x1f;
        address = cpu.readRegister(rn) + (immed5 * 4);
        destination = instruction & 0x7;
    } else if ((instruction >>> 9) == 0b0101100) {
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        destination = instruction & 0x7;
        address = cpu.readRegister(rn) + cpu.readRegister(rm);
    } else if ((instruction >>> 11) == 0b01001) {
        destination = (instruction >>> 8) & 0x7;
        let pc = cpu.readRegister(15);
        let immed8 = instruction & 0xff;
        address = (pc << 2) + (immed8 * 4);
    } else if ((instruction >>> 11) == 0b10011) {
        destination = (instruction >>> 8) & 0x7;
        let sp = cpu.readRegister(13);
        let immed8 = instruction & 0xff;
        address = (sp << 2) + (immed8 * 4);
    }
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    cpu.writeRegister(destination, cpu.read32(address));
}

export function LDRSHB(cpu: ARM7CPU): void {
    let isByte = false;
    let isSigned = false;
    let address: u32 = 0;
    let destination: u32 = 0;
    let instruction = cpu.currentInstruction;
    cpu.addCycles(1);

    // TODO: MAKE D.R.Y
    if ((instruction >>> 11) == 0b01111) {
        let rn = (instruction >>> 3) & 0x7;
        let immed5 = (instruction >>> 6) & 0x1f;
        address = cpu.readRegister(rn) + immed5;
        destination = instruction & 0x7;
        isByte = true;
    } else if ((instruction >>> 9) == 0b0101110) {
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        address = cpu.readRegister(rn) + cpu.readRegister(rm);
        destination = instruction & 0x7;
        isByte = true;
    } else if ((instruction >>> 11) == 0b10001) {
        let rn = (instruction >>> 3) & 0x7;
        let immed5 = (instruction >>> 6) & 0x1f;
        address = cpu.readRegister(rn) + (immed5 * 2);
        destination = instruction & 0x7;
    } else if ((instruction >>> 9) == 0b0101101) {
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        address = cpu.readRegister(rn) + cpu.readRegister(rm);
        destination = instruction & 0x7;
    } else if ((instruction >>> 9) == 0b0101011) {
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        address = cpu.readRegister(rn) + cpu.readRegister(rm);
        destination = instruction & 0x7;
        isSigned = true;
        isByte = true;
    } else if ((instruction >>> 9) == 0b0101111) {
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        address = cpu.readRegister(rn) + cpu.readRegister(rm);
        destination = instruction & 0x7;
        isSigned = true;
    }

    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    // LDRH
    if (!isByte && !isSigned) {
        cpu.writeRegister(destination, u32(cpu.read16(address)));

    }
    //LDRSH
    else if (!isByte && isSigned) {
        cpu.writeRegister(destination, signExtend(cpu.read16(address), 16));
    }
    //LDRB
    else if (isByte && !isSigned) {
        cpu.writeRegister(destination, cpu.read8(address));
    }
    //LDRSB
    else {
        cpu.writeRegister(destination, signExtend(cpu.read8(address), 8));
    }
}

export function STR(cpu: ARM7CPU): void {
    let destination: u32 = 0;
    let address: u32 = 0;
    let instruction = cpu.currentInstruction;

    cpu.prefetch();
    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    if ((instruction >>> 11) == 0b01100) {
        let rn = (instruction >>> 3) & 0x7;
        let immed5 = (instruction >>> 6) & 0x1f;
        address = cpu.readRegister(rn) + (immed5 * 4);
        destination = instruction & 0x7;
    } else if ((instruction >>> 9) == 0b0101000) {
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        destination = instruction & 0x7;
        address = cpu.readRegister(rn) + cpu.readRegister(rm);
    } else if ((instruction >>> 11) == 0b10010) {
        destination = (instruction >>> 8) & 0x7;
        let sp = cpu.readRegister(13);
        let immed8 = instruction & 0xff;
        address = (sp << 2) + (immed8 * 4);
    }
    cpu.write32(address, cpu.readRegister(destination));
}

export function STRSHB(cpu: ARM7CPU): void {
    let isByte = false;
    let address: u32 = 0;
    let destination: u32 = 0;
    let instruction = cpu.currentInstruction;
    cpu.addCycles(1);

    // TODO: MAKE D.R.Y
    if ((instruction >>> 11) == 0b01110) {
        let rn = (instruction >>> 3) & 0x7;
        let immed5 = (instruction >>> 6) & 0x1f;
        address = cpu.readRegister(rn) + immed5;
        destination = instruction & 0x7;
        isByte = true;
    } else if ((instruction >>> 9) == 0b0101010) {
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        address = cpu.readRegister(rn) + cpu.readRegister(rm);
        destination = instruction & 0x7;
        isByte = true;
    } else if ((instruction >>> 11) == 0b10000) {
        let rn = (instruction >>> 3) & 0x7;
        let immed5 = (instruction >>> 6) & 0x1f;
        address = cpu.readRegister(rn) + (immed5 * 2);
        destination = instruction & 0x7;
    } else if ((instruction >>> 9) == 0b0101001) {
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        address = cpu.readRegister(rn) + cpu.readRegister(rm);
        destination = instruction & 0x7;
    }

    cpu.accessType = Timing.Access.NON_SEQUENTIAL;
    if (isByte) {
        cpu.write8(address, cpu.readRegister(destination) & 0xff);
    } else {
        cpu.write16(address, cpu.readRegister(destination) & 0xffff);
    }
}

