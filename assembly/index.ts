
import { GBA } from "./gba";
import { KEYS } from "./keypad";


export const gba = new GBA();

export namespace console {
  export declare function log(msg: string): void;
}

export namespace loggers {
  export declare function logCPU(
    r0: u32,
    r1: u32,
    r2: u32,
    r3: u32,
    r4: u32,
    r5: u32,
    r6: u32,
    r7: u32,
    r8: u32,
    r9: u32,
    r10: u32,
    r11: u32,
    r12: u32,
    r13: u32,
    r14: u32,
    r15: u32,
    adjustedPC: u32,
    cpsr: u32,
    opcode: u32
  ): void;
}

export namespace callbacks {
  export declare function newFrame(arrayPointer: usize): void;
}


//
export function getRomArray(): Uint8Array {
  return gba.getGamePAK();
}

export function runFrame(): void {
  gba.runFrame();
}

export function pressKey(id: KEYS): void {
  gba.getKeyPad().pressKey(id);
}

export function releaseKey(id: KEYS): void {
  gba.getKeyPad().pressKey(id);
}





