import { getBit } from "../../../utils/bits";
import { ARM7CPU, StatusFlags } from "../../cpu";
import { asr, lsl, lsr, ShifterOutput } from "../arm/address-modes";
import { carryFrom, isNegative, signOverflowFrom, subSignOverflow, underflowFrom } from "../arm/alu";


@unmanaged class FormatResult {
    op1: u32;
    op2: u32;
    destination: u32;
    format: u32;
}



const formatResult: FormatResult = { op1: 0, op2: 0, destination: 0, format: 0 };


function deduceFormat(cpu: ARM7CPU): FormatResult {

    let instruction = cpu.currentInstruction;

    if ((instruction >>> 10) == 0b000110) {
        formatResult.format = 1;
        let rn = (instruction >>> 3) & 0x7;
        let rm = (instruction >>> 6) & 0x7;
        formatResult.op1 = cpu.readRegister(rn);
        formatResult.op2 = cpu.readRegister(rm);
        formatResult.destination = instruction & 0x7;
    }

    else if ((instruction >>> 10) == 0b000111) {
        formatResult.format = 2;
        let immed3 = (instruction >>> 6) & 0x7;
        let rn = (instruction >>> 3) & 0x7;
        formatResult.op1 = cpu.readRegister(rn);
        formatResult.op2 = immed3;
        formatResult.destination = instruction & 0x7;
    }

    else if ((instruction >>> 13) == 0b001) {
        formatResult.format = 3;
        let immed8 = instruction & 0xff;
        let rn = (instruction >>> 8) & 0x7;
        formatResult.op1 = cpu.readRegister(rn);
        formatResult.op2 = immed8;
        formatResult.destination = rn;
    }

    else if ((instruction >>> 13) == 0b000) {
        formatResult.format = 4;
        let shiftImmed = (instruction >>> 6) & 0x1f;
        let rm = (instruction >>> 3) & 0x7;
        formatResult.op1 = cpu.readRegister(rm);
        formatResult.op2 = shiftImmed;
        formatResult.destination = instruction & 0x7;
    }

    else if ((instruction >>> 10) == 0b010000) {
        formatResult.format = 5;
        let rn = instruction & 0x7;
        let rm = (instruction >>> 3) & 0x7;
        formatResult.op1 = cpu.readRegister(rn);
        formatResult.op2 = cpu.readRegister(rm);
        formatResult.destination = rn;
    }

    else if ((instruction >>> 12) == 0b1010) {
        formatResult.format = 6;
        let isPc = ((instruction >>> 11) & 0x1) == 0;
        if (isPc) {
            formatResult.op1 = cpu.readRegister(15);
        } else {
            formatResult.op1 = cpu.readRegister(13);
        }
        let immed8 = instruction & 0xff;
        formatResult.op2 = immed8;
        formatResult.destination = (instruction >>> 8) & 0x7;
    }

    else if ((instruction >>> 8) == 0b10110000) {
        formatResult.format = 7;
        formatResult.op1 = cpu.readRegister(13);
        let immed7 = instruction & 0x7f;
        formatResult.op2 = immed7;
        formatResult.destination = 13;
    }

    else if ((instruction >>> 10) == 0b010001) {
        formatResult.format = 8;
        let h1 = (instruction >>> 7) & 0x1;
        let h2 = (instruction >>> 6) & 0x1;
        let rn = (h1 << 3) | (instruction & 0x7);
        let rm = (h2 << 3) | ((instruction >>> 3) & 0x7);
        formatResult.op1 = cpu.readRegister(rn);
        formatResult.op2 = cpu.readRegister(rm);
        formatResult.destination = rn;
    } else {
        throw new Error("Unknown Format !");
    }
    return formatResult;
}

export function ADD(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let instruction = cpu.currentInstruction;
    let result: u32 = 0;
    let setFlags: boolean = true;
    // Base case 
    result = format.op1 + format.op2;

    if (format.format == 8) {
        setFlags = false;
    } else if (format.format == 6) {
        setFlags = false;
        if (!getBit(instruction, 11)) {
            result = (format.op1 & 0xFFFFFFFC) + (format.op2 << 2);
        } else {
            result = format.op1 + (format.op2 << 2);
        }
    } else if (format.format == 7) {
        setFlags = false;
        result = format.op1 + (format.op2 << 2);
    }




    cpu.writeRegister(format.destination, result);
    if (setFlags) {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = carryFrom(format.op1, format.op2);
        cpu.cpsr.v = signOverflowFrom(format.op1, format.op2);
    }



}

export function ADC(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);

    let carry = u32(cpu.cpsr.c);
    let result = format.op1 + format.op2 + carry;
    cpu.writeRegister(format.destination, result);


    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    cpu.cpsr.c = carryFrom(format.op1, format.op2 + carry) || carryFrom(format.op2, carry);
    cpu.cpsr.v = signOverflowFrom(format.op1, format.op2 + carry) || signOverflowFrom(format.op2, carry);
}

export function SUB(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result: u32 = 0;
    let setFlags: boolean = true;

    result = format.op1 - format.op2;

    if (format.format == 7) {
        setFlags = false;
        result = format.op1 + (format.op2 << 2);
    }


    cpu.writeRegister(format.destination, result);
    if (setFlags) {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = !underflowFrom(format.op1, format.op2);
        cpu.cpsr.v = subSignOverflow(format.op1, format.op2);
    }

}

export function SBC(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let carry: u32 = u32(!cpu.cpsr.c);
    let result = format.op1 - format.op2 - carry;
    cpu.writeRegister(format.destination, result);

    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    let tempRes = format.op1 - format.op2;
    let underflow = underflowFrom(format.op1, format.op2) ||
        underflowFrom(tempRes, carry);
    cpu.cpsr.c = u64(format.op1) >= (u64(format.op2) + u64(carry));
    cpu.cpsr.v = subSignOverflow(<i32>format.op1, <i32>format.op2) ||
        subSignOverflow(<i32>tempRes, <i32>carry);
}

export function AND(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = format.op1 & format.op2;
    cpu.writeRegister(format.destination, result);
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
}

export function BIC(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = format.op1 & (~format.op2);
    cpu.writeRegister(format.destination, result);
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
}

export function CMN(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = format.op1 + format.op2;
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    cpu.cpsr.c = carryFrom(format.op1, format.op2);
    cpu.cpsr.v = signOverflowFrom(format.op1, format.op2);
}

export function CMP(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = format.op1 - format.op2;

    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    cpu.cpsr.c = !underflowFrom(format.op1, format.op2);
    cpu.cpsr.v = subSignOverflow(format.op1, format.op2);
}

export function EOR(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = format.op1 ^ format.op2;
    cpu.writeRegister(format.destination, result);
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
}

export function MOV(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = format.op2;
    let setFlags = true;

    if (format.format == 8) {
        setFlags = false;
    }

    cpu.writeRegister(format.destination, result);
    if (setFlags) {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
    }
}

export function MUL(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result: u32 = format.op1 * format.op2;
    cpu.addCycles(2);
    cpu.writeRegister(format.destination, result);
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
}

export function MVN(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result: u32 = ~(format.op2);

    cpu.writeRegister(format.destination, result);
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
}

export function NEG(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = u32(0 - i32(format.op2));
    cpu.writeRegister(format.destination, result);
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    cpu.cpsr.c = !underflowFrom(0, format.op2);
    cpu.cpsr.v = subSignOverflow(0, <i32>format.op2);
}

export function ORR(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = format.op1 | format.op2;
    cpu.writeRegister(format.destination, result);
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
}

export function TST(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result = format.op1 & format.op2;
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
}

export function ASR(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let shifterOut: ShifterOutput;
    if (format.format == 4) {
        shifterOut = asr(format.op1, format.op2, true, cpu);
    } else {
        shifterOut = asr(format.op1, format.op2, false, cpu);
        cpu.addCycles(1);
    }

    cpu.writeRegister(format.destination, shifterOut.operand);
    cpu.cpsr.n = isNegative(shifterOut.operand);
    cpu.cpsr.z = shifterOut.operand == 0;
    cpu.cpsr.c = shifterOut.shifterOut != 0;
}

export function LSL(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let shifterOut: ShifterOutput = lsl(format.op1, format.op2, cpu);

    // trace("LSL", 3, format.op1, format.op2, shifterOut.operand);


    cpu.writeRegister(format.destination, shifterOut.operand);
    cpu.cpsr.n = isNegative(shifterOut.operand);
    cpu.cpsr.z = shifterOut.operand == 0;
    cpu.cpsr.c = shifterOut.shifterOut != 0;
}

export function LSR(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);

    let shifterOut: ShifterOutput;
    if (format.format == 4) {
        shifterOut = lsr(format.op1, format.op2, true, cpu);
    } else {
        shifterOut = lsr(format.op1, format.op2, false, cpu);
        cpu.addCycles(1);
    }

    cpu.writeRegister(format.destination, shifterOut.operand);
    cpu.cpsr.n = isNegative(shifterOut.operand);
    cpu.cpsr.z = shifterOut.operand == 0;
    cpu.cpsr.c = shifterOut.shifterOut != 0;
}


// Should have refactored ROR from ARM instructions
export function ROR(cpu: ARM7CPU): void {
    let format = deduceFormat(cpu);
    let result: u32 = 0;
    if ((format.op2 & 0xff) == 0) {
        result = format.op1;
    }
    else if ((format.op2 & 0x1f) == 0) {
        result = format.op1;
        cpu.cpsr.c = isNegative(format.op1);
    } else {
        let right = format.op1 >>> u32(format.op2 & 0x1f);
        let left = format.op1 << (32 - u32(format.op2 & 0x1f));
        cpu.cpsr.c = getBit(format.op1, u32(format.op2 & 0x1f) - 1);
        result = right | left;
    }


    cpu.writeRegister(format.destination, result);
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
}