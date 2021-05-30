import MemoryAccessor from '../memory/memory-accessor';
import MemoryMap from '../memory/memory-map';
import Queue from '../utils/queue';
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





export type instructionQueueFunc = (cpu: ARM7CPU) => void;


export class ARM7CPU implements MemoryAccessor {
    private _registerBank: RegisterBank = new RegisterBank();
    private _instructionQueue: Queue<instructionQueueFunc | null> = new Queue<instructionQueueFunc | null>(100);
    private _dataQueue: Queue<u32> = new Queue<u32>(100);
    private _opcodeQueue: Queue<u32> = new Queue<u32>(100);
    private _instructionStage: u32 = 0;
    private _memoryMap: MemoryMap;
    private _currentInstruction: u32 = 0;


    constructor(memoryMap: MemoryMap) {
        this._memoryMap = memoryMap;
    }

    tick(): void {
    }

    enqueuePipeline(func: instructionQueueFunc): void {
        this._instructionQueue.enqueue(func);
    }

    set instructionStage(stage: u32) {
        this.instructionStage = stage;
    }

    get instructionStage(): u32 {
        return this.instructionStage;
    }


    dequeuePipeline(): instructionQueueFunc {
        return (this._instructionQueue.dequeue() as instructionQueueFunc);
    }

    enqueueData(data: u32): void {
        this._dataQueue.enqueue(data);
    }

    dequeueData(): u32 {
        return this._dataQueue.dequeue();
    }

    get registers(): RegisterBank {
        return this._registerBank;
    }

    get currentInstruction(): u32 {
        return this._currentInstruction;
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

