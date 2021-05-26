import MemoryAccessor from '../memory/memory-accessor';
import { MemoryMap } from '../memory/memory-map';
import Queue from '../utils/queue';
import { CPSR, RegisterBank, StatusFlags } from './registers';

export enum CPU_MODES {

    USR = 0x10,
    FIQ = 0x11,
    IRQ = 0x12,
    SVC = 0x13,
    ABT = 0x17,
    UND = 0x1b,
    SYS = 0x1f
}




enum OPS {
    ADD,
    SUB,
    TEST,
    CMP,
    LOAD_REG,
    STORE_REG,
    LOAD_MEM,
    STORE_MEM,
    TEST_COND,
    LSL,
    ROR,
    RRX,
    LSR,
    ASR,
    ASL,
    WAIT_N,
    WAIT_I,
    WAIT_S,
    END_OP,
}

export type instructionQueueFunc = (cpu: ARM7CPU) => void;
function coolFunc(cpu: ARM7CPU): void {
    trace("HERE", 2, 3, 3);
}
export class ARM7CPU implements MemoryAccessor {
    private _registerBank: RegisterBank = new RegisterBank();
    private _instructionQueue: Queue<instructionQueueFunc | null> = new Queue<instructionQueueFunc | null>(100);
    private _dataQueue: Queue<u32> = new Queue<u32>(100);
    private _memoryMap: MemoryMap;
    private _currentInstruction: u32 = 0;


    constructor(memoryMap: MemoryMap) {
        this._memoryMap = memoryMap;
        this._instructionQueue.enqueue(coolFunc);
        (this._instructionQueue.dequeue() as instructionQueueFunc)(this);
    }

    enqueuePipeline(func: instructionQueueFunc) {
        this._instructionQueue.enqueue(func);
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

    readRegister(regNo: number): u32 {
        return this._registerBank.getRegister(regNo).read();
    }

    writeRegister(regNo: number, val: u32): void {
        this._registerBank.getRegister(regNo).write(val);
    }


    get CPSR(): CPSR {
        return this._registerBank.getCPSR();
    }


    isFlag(flag: StatusFlags): boolean {
        return this._registerBank.getCPSR().getFlag(flag);
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

