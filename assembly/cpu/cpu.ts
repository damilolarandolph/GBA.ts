import MemoryAccessor from '../memory/memory-accessor';
import MemoryMap from '../memory/memory-map';
import { getBit, getBits, setBit } from '../utils/bits';
import Queue from '../utils/queue';
import { armOpTable, opHandler } from './instructions/initialize';
import InterruptManager from './interrupt-manager';
//import { console } from '.././bridge';

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


export class ARM7CPU implements MemoryAccessor {
    private _instructionQueue: Queue<opHandler | null> = new Queue<opHandler | null>(100);
    private _opcodeQueue: Queue<u32> = new Queue<u32>(100);
    private _waitStates: u32 = 0;
    private _instructionStage: u32 = 0;
    private _memoryMap: MemoryMap;
    private _currentHandler: opHandler | null = null
    private _currentOp: u32 = 0;
    private interuptManager: InterruptManager;
    private _pipelining: boolean;
    private _cspr: u32;
    private _registers: StaticArray<u32> = new StaticArray(16);
    private _currentMode: CPU_MODES = CPU_MODES.USR;
    private _bankedRegisters: Map<CPU_MODES, StaticArray<u32>> = new Map();
    private _SPSRs: Map<CPU_MODES, u32> = new Map();


    constructor(memoryMap: MemoryMap, interruptManager: InterruptManager) {
        this._memoryMap = memoryMap;
        this.interuptManager = interruptManager;
        this.mode = CPU_MODES.USR;
        this.PC = 0x08000000
        this._bankedRegisters.set(CPU_MODES.SVC, new StaticArray(2));
        this._bankedRegisters.set(CPU_MODES.ABT, new StaticArray(2));
        this._bankedRegisters.set(CPU_MODES.UND, new StaticArray(2));
        this._bankedRegisters.set(CPU_MODES.IRQ, new StaticArray(2));
        this._bankedRegisters.set(CPU_MODES.FIQ, new StaticArray(7));

        this._SPSRs.set(CPU_MODES.SVC, 0);
        this._SPSRs.set(CPU_MODES.ABT, 0);
        this._SPSRs.set(CPU_MODES.UND, 0);
        this._SPSRs.set(CPU_MODES.IRQ, 0);
        this._SPSRs.set(CPU_MODES.FIQ, 0);
    }

    tick(): void {

        if (this._waitStates > 0) {
            --this._waitStates
            return;
        }

        if (this.instructionStage == 0) {

            if (!this._instructionQueue.isEmpty) {
                this._currentHandler = this._instructionQueue.dequeue();
                this._currentOp = this._opcodeQueue.dequeue();
            } else {
                this.prefetch();
            }
        }


        if (this._currentHandler != null) {
            if (this.instructionStage == 0) {
                // this.logState();
            }
            (this._currentHandler as opHandler)(this);
            if (this.instructionStage == 0) {
                this.prefetch()
            }

        }


    }

    handlerQueued(): boolean {
        return !this._instructionQueue.isEmpty;
    }

    enqueuePipeline(func: opHandler): void {
        this._instructionQueue.enqueue(func);
    }

    get pipelining(): boolean {
        return this._pipelining;
    }

    set pipelining(val: boolean) {
        this._pipelining = val;
    }

    private prefetch(): void {
        if (this._opcodeQueue.length > 0) {
            let currentInstruction = this._opcodeQueue.peek();
            // trace("Pushing Instruction", 1, currentInstruction);
            let row = getBits(currentInstruction, 27, 20);
            let col = getBits(currentInstruction, 7, 4);
            //trace("ROW AND COL", 2, row, col);
            let postition = row * 16 + col;
            //trace("POSTION", 1, postition)
            this._instructionQueue.enqueue(armOpTable[postition]);
        }

        this._opcodeQueue.enqueue(this.read32(this.PC));
        this.PC += 4;
        // trace("Program Counter is now", 1, this.PC);
    }

    set instructionStage(stage: u32) {
        this._instructionStage = stage;
    }

    get instructionStage(): u32 {
        return this._instructionStage;
    }


    dequeuePipeline(): opHandler {
        return (this._instructionQueue.dequeue() as opHandler);
    }



    get currentInstruction(): u32 {
        return this._currentOp;
    }

    readRegister(regNo: i32, mode: CPU_MODES = this._currentMode): u32 {
        return this.readRegMode(regNo, mode);
    }

    private readRegMode(regNo: i32, mode: CPU_MODES): u32 {
        if (mode == CPU_MODES.FIQ && regNo >= 8 && regNo < 15) {
            let index = regNo - 8;
            return this._bankedRegisters.get(CPU_MODES.FIQ)[i32(index)];
        }

        if ((mode != CPU_MODES.USR && mode != CPU_MODES.SYS) && regNo >= 13 && regNo < 15) {
            let index = regNo - 13;
            return this._bankedRegisters.get(mode)[i32(index)];
        }
        return this._registers[regNo];
    }
    private writeRegMode(regNo: i32, value: u32, mode: CPU_MODES): void {


        if (mode == CPU_MODES.FIQ && regNo >= 8 && regNo < 15) {
            let index = regNo - 8;
            this._bankedRegisters.get(CPU_MODES.FIQ)[i32(index)] = value;
            return;
        }

        if ((mode != CPU_MODES.USR && mode != CPU_MODES.SYS) && regNo >= 13 && regNo < 15) {
            let index = regNo - 13;
            this._bankedRegisters.get(mode)[i32(index)] = value;
            return;
        }
        this._registers[regNo] = value;
    }

    // private logState(): void {
    //     let row = getBits(this._currentOp, 27, 20);
    //     let col = getBits(this._currentOp, 7, 4);
    //     console.log(`
    //     R0: ${this.toHexString(this.readRegister(0))} R1: ${this.toHexString(this.readRegister(1))} R2: ${this.toHexString(this.readRegister(2))} R3: ${this.toHexString(this.readRegister(3))}
    //     R4: ${this.toHexString(this.readRegister(4))} R5: ${this.toHexString(this.readRegister(5))} R6: ${this.toHexString(this.readRegister(6))} R7: ${this.toHexString(this.readRegister(7))}
    //     R8: ${this.toHexString(this.readRegister(8))} R9: ${this.toHexString(this.readRegister(9))} R10: ${this.toHexString(this.readRegister(10))} R11: ${this.toHexString(this.readRegister(11))}
    //     R12: ${this.toHexString(this.readRegister(12))} R13: ${this.toHexString(this.readRegister(13))} R14: ${this.toHexString(this.readRegister(14))}
    //     PC: ${this.toHexString(this.readRegister(15))} PC (adjusted): ${this.toHexString(this.readRegister(15) - 8)}
    //     FLAGS: ${this.isFlag(StatusFlags.CARRY) ? 'C' : '-'}${this.isFlag(StatusFlags.NEGATIVE) ? 'N' : '-'}${this.isFlag(StatusFlags.ZERO) ? 'Z' : '-'}${this.isFlag(StatusFlags.OVERFLOW) ? 'V' : '-'}
    //     OPCODE: ${this.toHexString(this._currentOp)} ROW: ${this.toHexString(row)} COL: ${this.toHexString(col)}
    //     `);
    // }

    private toHexString(value: u32): string {
        return `0x${value.toString(16).toUpperCase()}`;
    }

    writeRegister(regNo: i32, val: u32, mode: CPU_MODES = this._currentMode): void {
        this.writeRegMode(regNo, val, mode);
        if (regNo == 15) {
            this.clearPipeline();
        }
    }

    finish(): void {
        this._currentHandler = null;
        this._currentOp = 0;
        this._instructionStage = 0;
    }

    clearPipeline(): void {
        this._opcodeQueue.flush();
        this._instructionQueue.flush();
        this._instructionStage = 0;
        this._waitStates = 0;
    }


    get CPSR(): u32 {
        return this._cspr;
    }

    get SPSR(): u32 {
        return this._SPSRs.get(this._currentMode);
    }

    set SPSR(val: u32) {
        this._SPSRs.set(this._currentMode, val);
    }

    set CPSR(data: u32) {
        this._cspr = data;
        this._currentMode = getBits(this._cspr, 4, 0);
    }


    isFlag(flag: StatusFlags): boolean {
        return getBit(this._cspr, flag);
    }

    get mode(): CPU_MODES {
        return this._currentMode;
    }

    set mode(val: CPU_MODES) {
        let newCpsr = (this.CPSR & ~(u32(0x1f))) | val
        this.CPSR = newCpsr;
    }

    flagVal(flag: StatusFlags): u32 {
        return this.isFlag(flag) ? u32(1) : u32(0);
    }

    setFlag(flag: StatusFlags, value: boolean): void {
        this.CPSR = setBit(this.CPSR, flag, value);
    }



    addWaitStates(val: number): void {

    }

    get PC(): u32 {
        return this.readRegister(15);
    }

    set PC(value: u32) {
        this.writeRegMode(15, value, CPU_MODES.USR);
    }

    read32(address: u32): u32 {
        return this._memoryMap.read32(address, this);
    }

    read16(address: u32): u16 {
        return this._memoryMap.read16(address, this);
    }

    read8(address: u32): u8 {
        return this._memoryMap.read8(address, this);
    }

    write8(address: u32, value: u8): void {
        this._memoryMap.write8(address, this, value);
    }

    write16(address: u32, value: u16): void {
        this._memoryMap.write16(address, this, value)
    }

    write32(address: u32, value: u32): void {
        this._memoryMap.write32(address, this, value);
    }

}

