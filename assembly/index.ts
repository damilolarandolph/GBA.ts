
import { GBA } from "./gba";


export var gba: GBA = new GBA();
export { GBA };
export { VideoController } from "./video/video-controller";
let arry: StaticArray<u8> = new StaticArray<u8>(4);
arry[0] = 10;
arry[1] = 20;
arry[2] = 30;


trace('pointer', 1, <f64>changetype<usize>(arry));

export namespace console {
  export declare function log(msg: string): void;
}

export namespace callbacks {
  export declare function newFrame(arrayPointer: usize): void;
}

export function getGBA(): GBA {
  return gba;
}




