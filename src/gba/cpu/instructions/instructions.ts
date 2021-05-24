import { getBits } from '../../utils/bits';
import { uint32 } from '../../utils/types';
import { ARM7CPU } from '../cpu';
import { StatusFlags } from '../registers';

export type InstructionHandler = (cpu: ARM7CPU) => void;


export const armInstructions: Record<number, Array<InstructionHandler>> = Array.from(new Array(256), _ => new Array(16));
export const thumbInstructions: Record<number, Array<InstructionHandler>> = Array.from(new Array(16), _ => new Array(16));

export function testCondition(cpu: ARM7CPU): boolean {
    let instruction = cpu.currentInstruction;
    let opcode = getBits(instruction, 31, 28);
    switch (opcode) {
        case 0x0:
            return cpu.CPSR.getFlag(StatusFlags.ZERO);
        case 0x1:
            return !cpu.CPSR.getFlag(StatusFlags.ZERO);
        case 0b0010:
            return cpu.CPSR.getFlag(StatusFlags.CARRY);
        case 0b0011:
            return !cpu.CPSR.getFlag(StatusFlags.CARRY);
        case 0b0100:
            return cpu.CPSR.getFlag(StatusFlags.NEGATIVE);
        case 0b0101:
            return !cpu.CPSR.getFlag(StatusFlags.NEGATIVE);
        case 0b0110:
            return cpu.CPSR.getFlag(StatusFlags.OVERFLOW);
        case 0b0111:
            return !cpu.CPSR.getFlag(StatusFlags.OVERFLOW);
        case 0b1000:
            return cpu.CPSR.getFlag(StatusFlags.CARRY) && !cpu.CPSR.getFlag(StatusFlags.ZERO);
        case 0b1001:
            return !cpu.CPSR.getFlag(StatusFlags.CARRY) && cpu.CPSR.getFlag(StatusFlags.ZERO);
        case 0b1010: {
            let negative = cpu.CPSR.getFlag(StatusFlags.NEGATIVE);
            let overflow = cpu.CPSR.getFlag(StatusFlags.CARRY);
            return negative == overflow;
        }
        case 0b1011: {
            let negative = cpu.CPSR.getFlag(StatusFlags.NEGATIVE);
            let overflow = cpu.CPSR.getFlag(StatusFlags.CARRY);
            return negative != overflow;
        }
        case 0b1100: {
            let zero = cpu.CPSR.getFlag(StatusFlags.ZERO);
            let negative = cpu.CPSR.getFlag(StatusFlags.NEGATIVE);
            let overflow = cpu.CPSR.getFlag(StatusFlags.OVERFLOW);
            return !zero && (negative == overflow);
        }
        case 0b1101: {
            let zero = cpu.CPSR.getFlag(StatusFlags.ZERO);
            let negative = cpu.CPSR.getFlag(StatusFlags.NEGATIVE);
            let overflow = cpu.CPSR.getFlag(StatusFlags.OVERFLOW);
            return zero && (negative != overflow);
        }
        case 0b1110:
            return true;
        default:
            return false;
    }
}