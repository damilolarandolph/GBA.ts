import { GBA } from '../gba';
import { SystemMemory } from '../memory/memory';
import { Timing } from '../memory/timings-map';
import { Scheduler } from '../scheduler';
import { getBit, getBits, setBit } from '../utils/bits';
import Queue from '../utils/queue';
import { armOpTable } from './instructions/arm-op-table';
import { testCondition, opHandler } from './instructions/instructions';
import { thumbOpTable } from './instructions/thumb-op-table';
import { InterruptManager } from './interrupt-manager';
import { console } from '../index';

export enum CPU_MODES {
    USR = 0x10,
    FIQ = 0x11,
    IRQ = 0x12,
    SVC = 0x13,
    ABT = 0x17,
    UND = 0x1b,
    SYS = 0x1f
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


class PSR {
    // Negative Flag
    n: boolean = false;

    // Zero Flag
    z: boolean = false;

    // Carry Flag
    c: boolean = false;

    // Overflow Flag
    v: boolean = false;

    // Thumb Mode
    thumb: boolean = false;

    // Irq Enabled
    irqDisabled: boolean = false;

    // FIQ Enabled
    fiqDisabled: boolean = false;

    // CPU Mode
    mode: u32 = CPU_MODES.USR;

    get val(): u32 {
        let flags: u32 = (u32(this.n) << 31) | (u32(this.z) << 30) | (u32(this.c) << 29) | (u32(this.v) << 28);
        let preModeFlags: u32 = (u32(this.irqDisabled) << 7) | (u32(this.fiqDisabled) << 6) | (u32(this.thumb) << 5);
        let result: u32 = flags | preModeFlags | this.mode;
        return result;
    }
    set val(value: u32) {
        this.n = getBit(value, 31);
        this.z = getBit(value, 30);
        this.c = getBit(value, 29);
        this.v = getBit(value, 28);

        this.irqDisabled = getBit(value, 7);
        this.fiqDisabled = getBit(value, 6);
        this.thumb = getBit(value, 5);
        this.mode = value & 0x1f;
    }
}




export class ARM7CPU {
    private _pipeline: StaticArray<u32> = [0, 0];
    private _memoryMap: SystemMemory;
    private interuptManager: InterruptManager;
    private _cspr: PSR = new PSR();
    private _registers: StaticArray<u32> = new StaticArray(31);
    private _spsrs: StaticArray<PSR> = [new PSR(), new PSR(), new PSR(), new PSR(), new PSR()];
    private scheduler: Scheduler;
    private currentOp: u32 = 0;
    public accessType: Timing.Access = Timing.Access.NON_SEQUENTIAL;



    constructor(
        memoryMap: SystemMemory,
        interruptManager: InterruptManager,
        scheduler: Scheduler
    ) {
        this.scheduler = scheduler;
        this._memoryMap = memoryMap;
        this.interuptManager = interruptManager;
        this.emulateBIOS();
    };

    private emulateBIOS(): void {
        this.writeRegister(0, 0x8000000);
        this.writeRegister(1, 0x000000EA);
        this.writeRegister(2, 0);
        this.writeRegister(3, 0);
        this.writeRegister(4, 0);
        this.writeRegister(5, 0);
        this.writeRegister(6, 0);
        this.writeRegister(7, 0);
        this.writeRegister(8, 0);
        this.writeRegister(9, 0);
        this.writeRegister(10, 0);
        this.writeRegister(11, 0);
        this.writeRegister(12, 0);
        this.writeRegister(13, 0x03007F00);
        this.writeRegister(14, 0);
        this.PC = 0x08000000
        this._cspr.val = 0x6000001F;
    }

    addCycles(val: u32 = 1): void {
        this.scheduler.addCycles(val);
    }

    tick(): void {
        if (!this.canExecute()) {
            this.prefetch();
        } else {
            this.execute();
            this.prefetch();
        }
    }

    execute(): void {
        // this.logState();
        this.currentOp = this._pipeline[0];
        let handler = this.getOpHandler(this._pipeline[0]);
        this._pipeline[0] = 0;

        if (!this._cspr.thumb) {
            if (testCondition(this)) {
                handler(this);
            } else {
                this.addCycles(1);
            }
        } else {
            handler(this);
        }

    }

    canExecute(): boolean {
        return this._pipeline[0] != 0;
    }

    private prefetchARM(): void {
        if (this._pipeline[0] == 0) {
            this._pipeline[0] = this.read32(this.PC);
            this.accessType = Timing.Access.SEQUENTIAL;
            this._pipeline[1] = this.read32(this.PC + 4);
            this.PC += 8;
        } else if (this._pipeline[1] == 0) {
            this._pipeline[1] = this.read32(this.PC);
            this.accessType = Timing.Access.SEQUENTIAL;
            this.PC += 4;
        }
    }

    private prefetchThumb(): void {
        if (this._pipeline[0] == 0) {
            this._pipeline[0] = this.read16(this.PC);
            this.accessType = Timing.Access.SEQUENTIAL;
            this._pipeline[1] = this.read16(this.PC + 2);
            this.PC += 4;
        } else if (this._pipeline[1] == 0) {
            this._pipeline[1] = this.read16(this.PC);
            this.accessType = Timing.Access.SEQUENTIAL;
            this.PC += 2;
        }
    }


    public prefetch(): void {
        if (this._pipeline[0] != 0 && this._pipeline[1] != 0) { return; }
        if (unchecked(this._pipeline[1]) != 0) {
            this._pipeline[0] = this._pipeline[1];
            this._pipeline[1] = 0;
        }

        if (this._cspr.thumb) {
            this.prefetchThumb()
        } else {
            this.prefetchARM();
        }
    }


    private getOpHandler(instruction: u32): opHandler {
        if (!this._cspr.thumb) {
            let row = getBits(instruction, 27, 20);
            let col = getBits(instruction, 7, 4);
            return (armOpTable[row][col] as opHandler);
        } else {
            let row = getBits(instruction, 15, 12);
            let col = getBits(instruction, 11, 6);
            return (thumbOpTable[row][col] as opHandler);
        }
    }



    get currentInstruction(): u32 {
        return this.currentOp;
    }

    readRegister(regNo: i32, mode: CPU_MODES = this._cspr.mode): u32 {
        return this.readRegMode(regNo, mode);
    }

    private readRegMode(regNo: i32, mode: CPU_MODES): u32 {


        if (regNo <= 7 || mode == CPU_MODES.USR || mode == CPU_MODES.SYS || regNo == 15) {
            return unchecked(this._registers[regNo])
        };

        const bankStart = 16;
        if (mode == CPU_MODES.SVC && regNo >= 13) {
            regNo = bankStart;
        } else if (mode == CPU_MODES.ABT && regNo >= 13) {
            regNo = bankStart + 2;
        } else if (mode == CPU_MODES.UND && regNo >= 13) {
            regNo = bankStart + 4;
        } else if (mode == CPU_MODES.IRQ && regNo >= 13) {
            regNo = bankStart + 6;
        } else if (mode == CPU_MODES.FIQ && regNo >= 8) {
            regNo = bankStart + 8;
        }

        return unchecked(this._registers[regNo]);
    }
    private writeRegMode(regNo: i32, value: u32, mode: CPU_MODES): void {
        if (regNo <= 7 || mode == CPU_MODES.USR || mode == CPU_MODES.SYS || regNo == 15) {
            unchecked(this._registers[regNo] = value);
            return;
        };

        const bankStart = 16;
        if (mode == CPU_MODES.SVC && regNo >= 13) {
            regNo = bankStart;
        } else if (mode == CPU_MODES.ABT && regNo >= 13) {
            regNo = bankStart + 2;
        } else if (mode == CPU_MODES.UND && regNo >= 13) {
            regNo = bankStart + 4;
        } else if (mode == CPU_MODES.IRQ && regNo >= 13) {
            regNo = bankStart + 6;
        } else if (mode == CPU_MODES.FIQ && regNo >= 8) {
            regNo = bankStart + 8;
        }

        unchecked(this._registers[regNo] = value);
        return;
    }

    // private logState(): void {
    //     // let row = getBits(this._currentOp, 27, 20);
    //     // let col = getBits(this._currentOp, 7, 4);
    //     let pc = this.readRegister(15);
    //     let adjustedPC = this._cspr.thumb ? pc - 2 : pc - 4;
    //     loggers.logCPU(
    //         this.readRegister(0),
    //         this.readRegister(1),
    //         this.readRegister(2),
    //         this.readRegister(3),
    //         this.readRegister(4),
    //         this.readRegister(5),
    //         this.readRegister(6),
    //         this.readRegister(7),
    //         this.readRegister(8),
    //         this.readRegister(9),
    //         this.readRegister(10),
    //         this.readRegister(11),
    //         this.readRegister(12),
    //         this.readRegister(13),
    //         this.readRegister(14),
    //         pc,
    //         adjustedPC,
    //         this._cspr.val,
    //         this.currentInstruction
    //     )
    //     // console.log(`
    //     // R0: ${this.toHexString(this.readRegister(0))} R1: ${this.toHexString(this.readRegister(1))} R2: ${this.toHexString(this.readRegister(2))} R3: ${this.toHexString(this.readRegister(3))}
    //     // R4: ${this.toHexString(this.readRegister(4))} R5: ${this.toHexString(this.readRegister(5))} R6: ${this.toHexString(this.readRegister(6))} R7: ${this.toHexString(this.readRegister(7))}
    //     // R8: ${this.toHexString(this.readRegister(8))} R9: ${this.toHexString(this.readRegister(9))} R10: ${this.toHexString(this.readRegister(10))} R11: ${this.toHexString(this.readRegister(11))}
    //     // R12: ${this.toHexString(this.readRegister(12))} R13: ${this.toHexString(this.readRegister(13))} R14: ${this.toHexString(this.readRegister(14))}
    //     // PC: ${this.toHexString(pc)} PC (adjusted): ${this.toHexString(adjustedPC)}
    //     // FLAGS: ${this.isFlag(StatusFlags.CARRY) ? 'C' : '-'}${this.isFlag(StatusFlags.NEGATIVE) ? 'N' : '-'}${this.isFlag(StatusFlags.ZERO) ? 'Z' : '-'}${this.isFlag(StatusFlags.OVERFLOW) ? 'V' : '-'}
    //     // THUMB: ${this.isFlag(StatusFlags.THUMB_MODE) ? "Yes" : "No"}
    //     // OPCODE: ${this.toHexString(this.currentInstruction)}
    //     // `);
    // }

    private toHexString(value: u32): string {
        return `0x${value.toString(16).toUpperCase()}`;
    }

    writeRegister(regNo: i32, val: u32, mode: CPU_MODES = this.cpsr.mode): void {
        this.writeRegMode(regNo, val, mode);
        if (regNo == 15) {
            this.accessType = Timing.Access.NON_SEQUENTIAL;
            this.clearPipeline();
        }
    }

    private clearPipeline(): void {
        unchecked(this._pipeline[0] = 0);
        unchecked(this._pipeline[1] = 0);
    }



    get cpsr(): PSR {
        return this._cspr;
    }

    get spsr(): PSR {
        switch (this._cspr.mode) {
            case CPU_MODES.SVC:
                return unchecked(this._spsrs[0]);
            case CPU_MODES.ABT:
                return unchecked(this._spsrs[1]);
            case CPU_MODES.UND:
                return unchecked(this._spsrs[2]);
            case CPU_MODES.IRQ:
                return unchecked(this._spsrs[3]);
            default:
                return unchecked(this._spsrs[4]);
        }
    }


    get PC(): u32 {
        return this.readRegister(15);
    }

    set PC(value: u32) {
        this.writeRegMode(15, value, CPU_MODES.USR);
    }

    read32(address: u32): u32 {
        this.addCycles(Timing.word(address, this.accessType));
        return this._memoryMap.read32(address);
    }

    read16(address: u32): u16 {
        this.addCycles(Timing.halfWord(address, this.accessType));
        return this._memoryMap.read16(address);
    }

    read8(address: u32): u8 {
        this.addCycles(Timing.halfWord(address, this.accessType));
        return this._memoryMap.read8(address);
    }

    write8(address: u32, value: u8): void {
        this.addCycles(Timing.byte(address, this.accessType));
        this._memoryMap.write8(address, value);
    }

    write16(address: u32, value: u16): void {
        this.addCycles(Timing.halfWord(address, this.accessType));
        this._memoryMap.write16(address, value)
    }

    write32(address: u32, value: u32): void {
        this.addCycles(Timing.word(address, this.accessType));
        this._memoryMap.write32(address, value);
    }

}

