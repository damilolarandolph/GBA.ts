import MemoryAccessor from '../memory/memory-accessor';
import { MemoryMap } from '../memory/memory-map';
import Queue from '../utils/queue';
import { uint16, uint32, uint8 } from '../utils/types';
import { InstructionHandler } from './instructions/instructions';
import { RegisterBank } from './registers';

export enum CPU_MODES {

    USR = 0x10,
    FIQ = 0x11,
    IRQ = 0x12,
    SVC = 0x13,
    ABT = 0x17,
    UND = 0x1b,
    SYS = 0x1f
}



type ExecPiplineFunc = () => void;


export class ARM7CPU implements MemoryAccessor {
    private _registerBank = new RegisterBank();
    private _instructionQueue = new Queue<ExecPiplineFunc | null>(30);
    private _memoryMap: MemoryMap;
    private _currentInstruction: uint32 = 0;

    constructor(memoryMap: MemoryMap) {
        this._memoryMap = memoryMap;
    }

    enqueuePipeline(func: ExecPiplineFunc | null) {
        this._instructionQueue.enqueue(func);
    }

    dequeuePipeline(): ExecPiplineFunc | null {
        return this._instructionQueue.dequeue();
    }

    get registers(): RegisterBank {
        return this._registerBank;
    }

    get currentInstruction(): uint32 {
        return this._currentInstruction;
    }

    readRegister(regNo: number): uint32 {
        return this._registerBank.getRegister(regNo).read();
    }

    writeRegister(regNo: number, val: uint32) {
        this._registerBank.getRegister(regNo).write(val);
    }

    readPC16() {

    }

    readPC32() {

    }

    getPC() {

    }

    get CPSR() {
        return this._registerBank.getCPSR();
    }

    /*    get SPSR() {
    
        } */

    addWaitStates(val: number) {
        for (; val > 0; --val)
            this.enqueuePipeline(null);
    }

    read32(address: uint32): uint32 {
        return this._memoryMap.read32(address, this);
    }

    read16(address: uint32): uint16 {
        return this._memoryMap.read16(address, this);
    }

    read8(address: uint32): uint8 {
        return this._memoryMap.read8(address, this);
    }

    write8(address: uint32, value: uint8) {
        return this._memoryMap.write8(address, this, value);
    }

    write16(address: uint32, value: uint16) {
        return this._memoryMap.write16(address, this, value)
    }

    write32(address: uint32, value: uint32) {
        return this._memoryMap.write32(address, this, value);
    }

}

