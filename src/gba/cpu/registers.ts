import { getBit, setBit } from '../utils/bits';
import { uint32 } from '../utils/types';
import { CPU_MODES } from './cpu';
export class RegisterBank {

    private registers: Record<number, Array<Register>> = {
        [CPU_MODES.USR]: [
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
        ],
        [CPU_MODES.FIQ]: [
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
        ],
        [CPU_MODES.SVC]: [
            new Register(),
            new Register()
        ],
        [CPU_MODES.ABT]: [
            new Register(),
            new Register()
        ],
        [CPU_MODES.IRQ]: [
            new Register(),
            new Register()
        ],
        [CPU_MODES.UND]: [
            new Register(),
            new Register(),
        ]
    }

    constructor() {
        this.registers[CPU_MODES.SYS] = this.registers[CPU_MODES.USR];
    }

    private CPSR = new CPSR();

    private SPSRs: Record<number, SPSR> = {
        [CPU_MODES.ABT]: new SPSR(),
        [CPU_MODES.FIQ]: new SPSR(),
        [CPU_MODES.IRQ]: new SPSR(),
        [CPU_MODES.SVC]: new SPSR(),
        [CPU_MODES.UND]: new SPSR(),
    }

    getRegister(regNo: number): Register {
        let mode = this.CPSR.getMode();
        if (mode == CPU_MODES.FIQ && regNo >= 8 && regNo < 15) {
            let index = regNo - 8;
            return this.registers[CPU_MODES.FIQ][index];
        }

        if ((mode != CPU_MODES.USR && mode != CPU_MODES.SYS) && regNo >= 13 && regNo < 15) {
            let index = regNo - 13;
            return this.registers[mode][index];
        }

        return this.registers[CPU_MODES.USR][regNo];
    }

    swapToSPSR(newMode: CPU_MODES) {
        this.SPSRs[newMode].write(this.CPSR.read());
        this.CPSR.setMode(newMode);
    }

    swapFromSPSR() {
        let mode = this.CPSR.getMode();
        this.CPSR.write(this.SPSRs[mode].read());
    }

    getCPSR() {
        return this.CPSR;
    }
}


class Register {
    protected data: uint32 = uint32(0);

    read(): uint32 {
        return this.data;
    }
    write(val: uint32) {
        this.data = val;
    }
}

export enum StatusFlags {
    NEGATIVE = 31,
    ZERO = 30,
    CARRY = 29,
    OVERFLOW = 28,
    IRQ_DISABLE = 7,
    FIQ_DISABLE = 6,
    THUMB_MODE = 5
}

class CPSR extends Register {
    getMode(): CPU_MODES {
        let mode = this.data & 0x1f;
        switch (mode) {
            case CPU_MODES.ABT:
                return CPU_MODES.ABT;
            case CPU_MODES.FIQ:
                return CPU_MODES.FIQ;
            case CPU_MODES.IRQ:
                return CPU_MODES.IRQ
            case CPU_MODES.SVC:
                return CPU_MODES.SVC;
            case CPU_MODES.SYS:
                return CPU_MODES.SYS;
            case CPU_MODES.UND:
                return CPU_MODES.UND;
        }
        throw new Error("UNKOWN REGISTER");
    }

    setMode(mode: CPU_MODES) {
        let newData = this.data & mode;
        this.data = newData;
    }

    setFlag(flag: StatusFlags, value: boolean) {
        this.data = setBit(this.data, flag, value);
    }

    getFlag(flag: StatusFlags): boolean {
        return getBit(this.data, flag);
    }
}

class SPSR extends CPSR { }