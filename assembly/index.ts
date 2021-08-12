
import { GBA } from "./gba";


export var gba: GBA = new GBA();
export { GBA };
export { VideoController } from "./video/video-controller";
export { Keypad } from './keypad';
let arry: StaticArray<u8> = new StaticArray<u8>(4);
arry[0] = 10;
arry[1] = 20;
arry[2] = 30;



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

export function getGBA(): GBA {
  return gba;
}




