
import { GBA } from "./gba";


export var gba: GBA = new GBA();
export { GBA };

export namespace console {
  export declare function log(msg: string): void;
}

export function getGBA(): GBA {
  return gba;
}




