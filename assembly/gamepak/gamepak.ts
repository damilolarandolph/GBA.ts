import { MemoryMap, MemoryMapImpl } from "../memory/memory-map";

// 32 MB cartridge;
// @ts-ignore: decorator
export const cartData = new Uint8Array(33554432);
export class GamePak extends MemoryMapImpl {
    constructor() {
        super(cartData, 0x08000000);
    }
}