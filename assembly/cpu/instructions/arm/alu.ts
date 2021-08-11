import { getBit, getBits } from "../../../utils/bits";
import { ARM7CPU, CPU_MODES, StatusFlags } from "../../cpu";
import { asri, asrr, dataProcImmediate, lsli, lslr, lsri, lsrr, rori, rorr, rotateRight, ShifterOutput, } from "./address-modes";


@inline
export function carryFrom(lhs: u32, rhs: u32): boolean {
    return rhs > ((u32(0xffffffff)) - lhs);
}

@inline
export function isNegative(val: u32): boolean {
    return getBit(val, 31);
}

@inline
export function underflowFrom(lhs: u32, rhs: u32): boolean {
    return rhs > lhs;
}

@inline
export function signOverflowFrom(lhs: u32, rhs: u32): boolean {
    let signedLhs = i32(lhs);
    let signedRhs = i32(rhs);
    let result = signedLhs + signedRhs;

    if (signedLhs < 0 && signedRhs < 0) {
        return result > 0;
    } else if (signedLhs > 0 && signedRhs > 0) {
        return result < 0;
    }

    return false;
}

export function deduceAddressing(cpu: ARM7CPU): ShifterOutput {
    let currentInstruction = cpu.currentInstruction;
    let immediateFlag = getBit(currentInstruction, 25);
    if (immediateFlag) {
        return dataProcImmediate(currentInstruction, cpu);
    }

    let shiftRegFlag = getBit(currentInstruction, 4);
    let shiftType = getBits(currentInstruction, 6, 5);

    if (shiftRegFlag) {
        cpu.addCycles(1);
        if (shiftType == 0)
            return lslr(cpu);
        else if (shiftType == 1)
            return lsrr(cpu);
        else if (shiftType == 2)
            return asrr(cpu);
        else if (shiftType == 3)
            return rorr(currentInstruction, cpu);
    } else {
        if (shiftType == 0)
            return lsli(cpu);
        else if (shiftType == 1)
            return lsri(cpu);
        else if (shiftType == 2)
            return asri(cpu);
        else if (shiftType == 3)
            return rori(cpu);
    }

    throw new Error("ADDRESSING NOT FOUND");
}

export function ADDC(cpu: ARM7CPU): void {
    cpu.prefetch();
    let shifterOut = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let carryOut = u32(cpu.cpsr.c);
    let result = rnVal + shifterOut.operand + carryOut;
    cpu.writeRegister(rd, result);
    if (!sBit) {
        return;
    }
    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {

        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = carryFrom(rnVal, shifterOut.operand + carryOut) || carryFrom(shifterOut.operand, carryOut);
        cpu.cpsr.v = signOverflowFrom(rnVal, shifterOut.operand + carryOut) || signOverflowFrom(shifterOut.operand, carryOut);
    }

}

export function ADD(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOut = deduceAddressing(cpu);

    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let result = rnVal + shifterOut.operand;
    cpu.writeRegister(rd, result);
    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = carryFrom(rnVal, shifterOut.operand);
        cpu.cpsr.v = signOverflowFrom(rnVal, shifterOut.operand);
    }

}




export function AND(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let result = rnVal & shifterOutput.operand;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = shifterOutput.shifterOut != 0;
    }

}


export function BIC(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let result = rnVal & (~shifterOutput.operand);
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = shifterOutput.shifterOut != 0;
    }

}


export function CMN(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let result = rnVal + shifterOutput.operand;

    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    cpu.cpsr.c = carryFrom(rnVal, shifterOutput.operand);
    cpu.cpsr.v = signOverflowFrom(rnVal, shifterOutput.operand);

}



export function CMP(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let result = rnVal - shifterOutput.operand;
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    cpu.cpsr.c = !underflowFrom(rnVal, shifterOutput.operand);
    cpu.cpsr.v = subSignOverflow(i32(rnVal), i32(shifterOutput.operand));

}

@inline
export function subSignOverflow(lhs: i32, rhs: i32): boolean {
    /**
     *  If 2 Two's Complement numbers are subtracted, 
     * and their signs are different, 
     * then overflow occurs if and only if 
     * the result has the same sign as the subtrahend.
        Overflow occurs if
        (+A) − (−B) = −C
        (−A) − (+B) = +C
     */
    let result = lhs - rhs;
    if ((lhs >= 0) && (rhs < 0) && (result < 0)) {
        return true;
    }

    if ((lhs < 0) && (rhs >= 0) && (result >= 0)) {
        return true;
    }

    return false;
}


export function EOR(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);
    let instruction = cpu.currentInstruction;
    let rd = getBits(instruction, 15, 12);
    let rn = getBits(instruction, 19, 16);
    let rnVal = cpu.readRegister(rn);
    let sBit = getBit(instruction, 20);
    let result = rnVal ^ shifterOutput.operand;
    cpu.writeRegister(rd, result);
    if (!sBit) {
        return
    }
    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = shifterOutput.shifterOut != 0;
    }

}



export function MOV(cpu: ARM7CPU): void {

    let shifterOutput = deduceAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let sBit = getBit(cpu.currentInstruction, 20);

    cpu.writeRegister(rd, shifterOutput.operand);
    if (!sBit) {
        return;
    }
    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(shifterOutput.operand);
        cpu.cpsr.z = shifterOutput.operand == 0;
        cpu.cpsr.c = shifterOutput.shifterOut != 0;
    }
    cpu.prefetch();
}


export function MRS(cpu: ARM7CPU): void {

    cpu.prefetch();
    let rd = getBits(cpu.currentInstruction, 15, 12);
    if (getBit(cpu.currentInstruction, 22)) {
        cpu.writeRegister(rd, cpu.spsr.val);
    } else {
        cpu.writeRegister(rd, cpu.cpsr.val);
    }
}

export function MSR(cpu: ARM7CPU): void {

    cpu.prefetch();
    let Rbit = getBit(cpu.currentInstruction, 22);
    let fieldMask = getBits(cpu.currentInstruction, 19, 16);

    let msrOP: u32;
    if (getBit(cpu.currentInstruction, 25)) {
        msrOP = rotateRight(
            getBits(cpu.currentInstruction, 7, 0),
            getBits(cpu.currentInstruction, 11, 8) * 2,
            cpu).operand;
    } else {
        msrOP = cpu.readRegister(getBits(cpu.currentInstruction, 3, 0));
    }
    let newVal: u32 = 0;
    if (!Rbit) {
        newVal = cpu.cpsr.val;
    } else {
        newVal = cpu.spsr.val;
    }

    if (Rbit && (cpu.cpsr.mode == CPU_MODES.USR || cpu.cpsr.mode == CPU_MODES.SYS)) {
        return;
    }

    if (getBit(fieldMask, 3)) {
        let fields = (msrOP >>> 24) << 24;
        let fieldsInv = ~(u32(0xff) << 24);
        newVal = (newVal & fieldsInv) | fields;
    }

    // Should only happen setting CPSR
    if (cpu.cpsr.mode == CPU_MODES.USR) {
        cpu.cpsr.val = newVal;
        return;
    }

    if (getBit(fieldMask, 0)) {
        let mask = msrOP & 0xff;
        newVal = (newVal & ~(u32(0xff))) | mask;
    }


    if (getBit(fieldMask, 1)) {
        let fields = ((msrOP >>> 8) & 0xff) << 8;
        let fieldsInv = ~(u32(0xff) << 8);
        newVal = (newVal & fieldsInv) | fields;
    }

    if (getBit(fieldMask, 2)) {
        let fields = ((msrOP >>> 16) & 0x7f) << 16;
        let fieldsInv = ~(u32(0x7f) << 16);
        newVal = (newVal & fieldsInv) | fields;
    }

    if (!Rbit) {
        cpu.cpsr.val = newVal;
    } else {
        cpu.spsr.val = newVal;
    }
}


export function MVN(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    let sBit = getBit(cpu.currentInstruction, 20);
    let result = ~shifterOutput.operand;
    cpu.writeRegister(rd, result);
    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = shifterOutput.shifterOut != 0;
    }
}

export function ORR(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);


    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let rnVal = cpu.readRegister(rn);
    let result = rnVal | shifterOutput.operand;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }
    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = shifterOutput.shifterOut != 0;
    }


}

export function RSB(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let rnVal = cpu.readRegister(rn);
    let result = shifterOutput.operand - rnVal;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = !underflowFrom(shifterOutput.operand, rnVal);
        cpu.cpsr.v = subSignOverflow(<i32>shifterOutput.operand, <i32>rnVal);
    }

}

export function RSC(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let notC = u32(!cpu.cpsr.c);
    let rnVal = cpu.readRegister(rn);
    let result = shifterOutput.operand - rnVal - notC;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }
    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = u64(shifterOutput.operand) >= (u64(rnVal) + u64(notC));
        cpu.cpsr.v = subSignOverflow(<i32>shifterOutput.operand, <i32>rnVal);
    }

}

export function SUB(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);
    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let rnVal = cpu.readRegister(rn);
    let result = rnVal - shifterOutput.operand;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }
    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        cpu.cpsr.c = !underflowFrom(rnVal, shifterOutput.operand);
        cpu.cpsr.v = subSignOverflow(<i32>rnVal, <i32>shifterOutput.operand);
    }

}

export function SBC(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);

    let rd = getBits(cpu.currentInstruction, 15, 12);
    let rn = getBits(cpu.currentInstruction, 19, 16);
    let sBit = getBit(cpu.currentInstruction, 20);
    let notC = u32(!cpu.cpsr.c);
    let rnVal = cpu.readRegister(rn);
    let result = rnVal - shifterOutput.operand - notC;
    cpu.writeRegister(rd, result);

    if (!sBit) {
        return;
    }

    if (rd == 15) {
        cpu.cpsr.val = cpu.spsr.val;
    } else {
        cpu.cpsr.n = isNegative(result);
        cpu.cpsr.z = result == 0;
        let tempRes = rnVal - shifterOutput.operand;
        cpu.cpsr.c = u64(rnVal) >= (u64(shifterOutput.operand) + u64(notC));
        cpu.cpsr.v = subSignOverflow(<i32>rnVal, <i32>shifterOutput.operand) ||
            subSignOverflow(<i32>tempRes, <i32>notC);
    }

}

export function TEQ(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);

    let rn = getBits(cpu.currentInstruction, 19, 16);
    let result = cpu.readRegister(rn) ^ shifterOutput.operand;
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    cpu.cpsr.c = shifterOutput.shifterOut != 0;

}

export function TST(cpu: ARM7CPU): void {

    cpu.prefetch();
    let shifterOutput = deduceAddressing(cpu);

    let rn = getBits(cpu.currentInstruction, 19, 16);
    let result = cpu.readRegister(rn) & shifterOutput.operand;
    cpu.cpsr.n = isNegative(result);
    cpu.cpsr.z = result == 0;
    cpu.cpsr.c = shifterOutput.shifterOut != 0;

}










