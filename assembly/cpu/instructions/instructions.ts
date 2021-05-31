import { getBits } from '../../utils/bits';
import { ARM7CPU } from '../cpu';
import { StatusFlags } from '../registers';

export type InstructionHandler = (cpu: ARM7CPU) => void;



export function testCondition(cpu: ARM7CPU): boolean {
    let instruction = cpu.currentInstruction;
    let opcode = getBits(instruction, 31, 28);
    switch (opcode) {
        case 0x0:
            return cpu.isFlag(StatusFlags.ZERO);
        case 0x1:
            return !cpu.isFlag(StatusFlags.ZERO);
        case 0b0010:
            return cpu.isFlag(StatusFlags.CARRY);
        case 0b0011:
            return !cpu.isFlag(StatusFlags.CARRY);
        case 0b0100:
            return cpu.isFlag(StatusFlags.NEGATIVE);
        case 0b0101:
            return !cpu.isFlag(StatusFlags.NEGATIVE);
        case 0b0110:
            return cpu.isFlag(StatusFlags.OVERFLOW);
        case 0b0111:
            return !cpu.isFlag(StatusFlags.OVERFLOW);
        case 0b1000:
            return cpu.isFlag(StatusFlags.CARRY) && !cpu.isFlag(StatusFlags.ZERO);
        case 0b1001:
            return !cpu.isFlag(StatusFlags.CARRY) && cpu.isFlag(StatusFlags.ZERO);
        case 0b1010: {
            let negative = cpu.isFlag(StatusFlags.NEGATIVE);
            let overflow = cpu.isFlag(StatusFlags.CARRY);
            return negative == overflow;
        }
        case 0b1011: {
            let negative = cpu.isFlag(StatusFlags.NEGATIVE);
            let overflow = cpu.isFlag(StatusFlags.CARRY);
            return negative != overflow;
        }
        case 0b1100: {
            let zero = cpu.isFlag(StatusFlags.ZERO);
            let negative = cpu.isFlag(StatusFlags.NEGATIVE);
            let overflow = cpu.isFlag(StatusFlags.OVERFLOW);
            return !zero && (negative == overflow);
        }
        case 0b1101: {
            let zero = cpu.isFlag(StatusFlags.ZERO);
            let negative = cpu.isFlag(StatusFlags.NEGATIVE);
            let overflow = cpu.isFlag(StatusFlags.OVERFLOW);
            return zero && (negative != overflow);
        }
        case 0b1110:
            return true;
        default:
            return false;
    }
}