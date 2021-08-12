import { InterruptManager } from "./cpu/interrupt-manager";
import IODevice from './io/io-device';



export enum KEYS {
    BUTTON_A,
    BUTTON_B,
    SELECT,
    START,
    RIGHT,
    LEFT,
    UP,
    DOWN,
    BUTTON_R,
    BUTTON_L
}

export class Keypad implements IODevice {
    private interruptManager: InterruptManager;
    private keyStat: u16 = 0x3ff;

    constructor(interruptManager: InterruptManager) {
        this.interruptManager = interruptManager;
    }

    writeIO(address: u32, value: u8): void {
        address = address & 0x3;
    }
    readIO(address: u32): u8 {
        address = address & 0x3;
        switch (address) {
            case 0:
                let val = u8(this.keyStat & 0xff);
                return val;
            case 1:
                let value = u8(this.keyStat >> 8) & 0xff;
                return value
        }
        return 0;
    }

    pressKey(key: KEYS): void {
        trace("KEYPRESS", 1, key);
        let clearBit = ~(u16(1) << u16(key));
        this.keyStat = this.keyStat & clearBit;
        trace("KEYSTAT1", 1, this.keyStat);
    }

    releaseKey(key: KEYS): void {
        trace("KEYUP", 1, key);
        let setBit = u16(1) << u16(key);
        this.keyStat = this.keyStat | setBit;
        trace("KEYSTAT2", 1, this.keyStat);
    }

}