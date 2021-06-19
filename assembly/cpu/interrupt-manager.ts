import IODevice from "../io/io-device";
import MemoryMap from "../memory/memory-map";
import { getBit, setBit } from "../utils/bits";
import { ARM7CPU, CPU_MODES } from "./cpu";


enum INTERRUPTS {
    VBLANK,
    HBLANK,
    COUNTERMATCH,
    TIMER_0_OVERFLOW,
    TIMER_1_OVERFLOW,
    TIMER_2_OVERFLOW,
    TIMER_3_OVERFLOW,
    SERIAL,
    DMA_0,
    DMA_1,
    DMA_2,
    DMA_3,
    KEYPAD,
    GAMEPAK
}


export default class InterruptManager implements IODevice {
    private ime: u32 = 0;
    private ie: u16 = 0;
    private if: u16 = 0;


    handleInterrupts(cpu: ARM7CPU): void {
        cpu.writeRegister(15, 0x00000128);
    }


    public requestInterrupt(interrupt: INTERRUPTS): void {
        this.if = setBit(this.if, interrupt, true);
    }

    public hasServicableInterrupts(): bool {
        return this.interruptsEnabled() && (this.ie & this.if) != 0
    }

    public enableInterrupt(interrupt: INTERRUPTS): void {
        this.ie = setBit(this.ie, interrupt, true);
    }

    public disableInterrupt(interrupt: INTERRUPTS): void {
        this.ie = setBit(this.ie, interrupt, false);
    }

    public unrequestInterrupt(interrupt: INTERRUPTS): void {
        this.if = setBit(this.if, interrupt, false);
    }


    public interruptsEnabled(): bool {
        return this.ime == 0;
    }

    public enableInterrupts(): void {
        this.ime = 1;
    }

    public disableInterrupts(): void {
        this.ime = 0;
    }


    writeIO(address: u32, value: u32): void {
        throw new Error("Method not implemented.");
    }
    readIO(address: u32): u32 {
        throw new Error("Method not implemented.");
    }

}