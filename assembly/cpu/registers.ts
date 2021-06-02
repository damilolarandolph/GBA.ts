import { getBit, setBit } from '../utils/bits';
import { CPU_MODES } from './cpu';
export class RegisterBank {

    private registers: Map<i32, Array<Register>> = new Map();

    constructor() {

        this.registers.set(CPU_MODES.USR, [
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
        ])

        this.registers.set(CPU_MODES.FIQ, [
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
            new Register(),
        ])
        this.registers.set(CPU_MODES.SVC, [
            new Register(),
            new Register()
        ])
        this.registers.set(CPU_MODES.ABT, [
            new Register(),
            new Register()
        ])
        this.registers.set(CPU_MODES.IRQ, [
            new Register(),
            new Register()
        ])
        this.registers.set(CPU_MODES.UND, [
            new Register(),
            new Register(),
        ])
        this.registers.set(CPU_MODES.SYS, this.registers.get(CPU_MODES.USR));
        this.SPSRs.set(CPU_MODES.ABT, new SPSR());
        this.SPSRs.set(CPU_MODES.FIQ, new SPSR());
        this.SPSRs.set(CPU_MODES.IRQ, new SPSR());
        this.SPSRs.set(CPU_MODES.SVC, new SPSR());
        this.SPSRs.set(CPU_MODES.UND, new SPSR());
    }

    private CPSR: CPSR = new CPSR();

    private SPSRs: Map<number, SPSR> = new Map();

    getRegister(regNo: number, mode: CPU_MODES): Register {
        if (mode == CPU_MODES.FIQ && regNo >= 8 && regNo < 15) {
            let index = regNo - 8;
            return this.registers.get(CPU_MODES.FIQ)[i32(index)];
        }

        if ((mode != CPU_MODES.USR && mode != CPU_MODES.SYS) && regNo >= 13 && regNo < 15) {
            let index = regNo - 13;
            return this.registers.get(mode)[i32(index)];
        }

        return this.registers.get(CPU_MODES.USR)[i32(regNo)];
    }

    getRegisterForCurrentMode(regNo: number): Register {
        let mode = this.CPSR.getMode();
        return this.getRegister(regNo, mode);
    }

    swapToSPSR(newMode: CPU_MODES): void {
        this.SPSRs.get(newMode).write(this.CPSR.read());
        this.CPSR.setMode(newMode);
    }

    swapFromSPSR(): void {
        let mode = this.CPSR.getMode();
        this.CPSR.write(this.SPSRs.get(mode).read());
    }

    getCPSR(): CPSR {
        return this.CPSR;
    }

    getSPSR(): SPSR {
        return this.SPSRs.get(this.CPSR.getMode());
    }

}


export class Register {
    protected data: u32 = 0;

    read(): u32 {
        return this.data;
    }
    write(val: u32): void {
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

export class CPSR extends Register {
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
            case CPU_MODES.USR:
                return CPU_MODES.USR;
        }
        throw new Error("UNKOWN REGISTER");
    }

    setMode(mode: CPU_MODES): void {
        let newData = (this.data & 0x1f) | mode;
        this.data = newData;
    }

    setFlag(flag: StatusFlags, value: boolean): void {
        this.data = setBit(this.data, flag, value);
    }

    getFlag(flag: StatusFlags): boolean {
        return getBit(this.data, flag);
    }
}

class SPSR extends CPSR { }