import { getBits } from '../../utils/bits';
import { ARM7CPU } from '../cpu';


export type opHandler = (cpu: ARM7CPU) => void;


export function testCondition(cpu: ARM7CPU): boolean {
    let instruction = cpu.currentInstruction;
    let opcode: u32;
    if (cpu.cpsr.thumb) {
        opcode = getBits(instruction, 11, 8);
    } else {
        opcode = getBits(instruction, 31, 28);
    }
    switch (opcode) {
        case 0x0:
            return cpu.cpsr.z;
        case 0x1:
            return !cpu.cpsr.z;
        case 0b0010:
            return cpu.cpsr.c;
        case 0b0011:
            return !cpu.cpsr.c;
        case 0b0100:
            return cpu.cpsr.n;
        case 0b0101:
            return !cpu.cpsr.n;
        case 0b0110:
            return cpu.cpsr.v;
        case 0b0111:
            return !cpu.cpsr.v;
        case 0b1000:
            return cpu.cpsr.c && !cpu.cpsr.z;
        case 0b1001:
            return !cpu.cpsr.c && cpu.cpsr.z;
        case 0b1010: {
            return cpu.cpsr.n == cpu.cpsr.v;
        }
        case 0b1011: {
            return cpu.cpsr.n != cpu.cpsr.v;
        }
        case 0b1100: {
            return !cpu.cpsr.z && (cpu.cpsr.n == cpu.cpsr.v);
        }
        case 0b1101: {
            return cpu.cpsr.z && (cpu.cpsr.n != cpu.cpsr.v);
        }
        case 0b1110:
            return true;
        default:
            return false;
    }
}