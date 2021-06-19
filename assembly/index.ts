
import { cartData } from "./gamepak/gamepak";
import GBA from "./gba";

var gba: GBA = new GBA();



export function getCartData(): Uint8Array {

  return cartData;
}

export function run(): void {
  gba.run();
}

export function getGBA(): GBA {
  return gba;
}




