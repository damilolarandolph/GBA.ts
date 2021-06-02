import MemoryAccessor from '../memory/memory-accessor';
import MemoryMap from '../memory/memory-map';
import { getBits } from '../utils/bits';
import Queue from '../utils/queue';
import { armOpTable, opHandler } from './instructions/initialize';
import { RegisterBank, StatusFlags } from './registers';

export enum CPU_MODES {

    USR = 0x10,
    FIQ = 0x11,
    IRQ = 0x12,
    SVC = 0x13,
    ABT = 0x17,
    UND = 0x1b,
    SYS = 0x1f
}





export class ARM7CPU implements MemoryAccessor {
    private _registerBank: RegisterBank = new RegisterBank();
    private _instructionQueue: Queue<opHandler | null> = new Queue<opHandler | null>(100);
    private _opcodeQueue: Queue<u32> = new Queue<u32>(100);
    private _piplineLength: i32 = 0;
    private _waitStates: u32 = 0;
    private _instructionStage: u32 = 0;
    private _memoryMap: MemoryMap;


    constructor(memoryMap: MemoryMap) {
        this._memoryMap = memoryMap;
        this._registerBank.getCPSR().setMode(CPU_MODES.USR);
    }

    tick(): void {
        if (this._waitStates > 0) {
            --this._waitStates
            return;
        }

        // if (!this._instructionQueue.isEmpty) {
        //     (this._instructionQueue.peek() as opHandler)(this)
        // }

        // --this._piplineLength
        // if (this._waitStates == 0) {
        //     this.prefetch();
        // }
    }

    enqueuePipeline(func: opHandler): void {
        this._instructionQueue.enqueue(func);
    }

    private prefetch(): void {
        if (this._piplineLength > 3) {
            return;
        }
        if (this._piplineLength > 1) {
            let postition = getBits(this.currentInstruction, 27, 20) * getBits(this.currentInstruction, 7, 4);
            this._instructionQueue.enqueue(armOpTable[postition]);
        }
        this._opcodeQueue.enqueue(this.read32(this.PC));
        this.PC += 4;
        this._piplineLength++

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

    get registers(): RegisterBank {
        return this._registerBank;
    }

    get currentInstruction(): u32 {
        return this._opcodeQueue.peek();
    }

    readRegister(regNo: number, mode: CPU_MODES = -1): u32 {
        if (mode == -1) {
            return this._registerBank.getRegisterForCurrentMode(regNo).read();
        } else {
            return this._registerBank.getRegister(regNo, mode).read();
        }
    }

    writeRegister(regNo: number, val: u32, mode: CPU_MODES = -1): void {
        if (mode == -1) {
            this._registerBank.getRegisterForCurrentMode(regNo).write(val);
        } else {
            this._registerBank.getRegister(regNo, mode).write(val);
        }
    }

    finish(): void {
        this._opcodeQueue.dequeue();
        this._instructionQueue.dequeue();
        this._instructionStage = 0;
    }

    clearPipeline(): void {
        this._opcodeQueue.flush();
        this._instructionQueue.flush();
        this._instructionStage = 0;
        this._waitStates = 0;
    }


    get CPSR(): u32 {
        return this._registerBank.getCPSR().read();
    }

    get SPSR(): u32 {
        return this._registerBank.getSPSR().read();
    }

    set SPSR(val: u32) {
        this._registerBank.getCPSR().write(val)
    }

    set CPSR(data: u32) {
        this._registerBank.getCPSR().write(this._registerBank.getCPSR().read());
    }


    isFlag(flag: StatusFlags): boolean {
        return this._registerBank.getCPSR().getFlag(flag);
    }

    get mode(): CPU_MODES {
        return this._registerBank.getCPSR().getMode();
    }

    set mode(val: CPU_MODES) {
        this._registerBank.getCPSR().setMode(val);
    }

    flagVal(flag: StatusFlags): u32 {
        return this.isFlag(flag) ? u32(1) : u32(0);
    }

    setFlag(flag: StatusFlags, value: boolean): void {
        this._registerBank.getCPSR().setFlag(flag, value);
    }

    /*    get SPSR() {
    
        } */

    addWaitStates(val: number): void {

    }

    get PC(): u32 {
        return this._registerBank.getRegisterForCurrentMode(15).read();
    }

    set PC(value: u32) {
        this._registerBank.getRegisterForCurrentMode(15).write(value);
        this.clearPipeline();
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
        return this._memoryMap.write8(address, this, value);
    }

    write16(address: u32, value: u16): void {
        return this._memoryMap.write16(address, this, value)
    }

    write32(address: u32, value: u32): void {
        return this._memoryMap.write32(address, this, value);
    }

}

