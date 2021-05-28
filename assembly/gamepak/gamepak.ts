import MemoryAccessor from "../memory/memory-accessor";
import { MemoryMap } from "../memory/memory-map";

// 32 MB cartridge;
// @ts-ignore: decorator
@global
export var cartData = new Uint8Array(32000000);
export default class GamePak extends MemoryMap {


    read32(address: u32, accessor: MemoryAccessor): u32 {
        let byte1 = cartData[address];
        let byte2 = cartData[address + 1];
        let byte3 = cartData[address + 2];
        let byte4 = cartData[address + 3];
        let data = (byte4 << 24) | (byte3 << 16) | (byte2 << 8) | byte1;
        return data;
    }

    read16(address: u32, accessor: MemoryAccessor): u16 {
        let byte1 = cartData[address];
        let byte2 = cartData[address + 1];
        let data = (byte2 << 8) | byte1;
        return data;
    }

    read8(address: u32, accessor: MemoryAccessor): u8 {
        return cartData[address];
    }

    write8(address: u32, accessor: MemoryAccessor, value: u8): void {
        cartData[address] = value;
    }

    write16(address: u32, accessor: MemoryAccessor, value: u16): void {
        cartData[address] = value & 0xff;
        value >>>= 8;
        cartData[address + 1] = value & 0xff;
    }

    write32(address: u32, accessor: MemoryAccessor, value: u32): void {
        cartData[address] = value & 0xff;
        value >>>= 8;
        cartData[address + 1] = value & 0xff;
        value >>>= 8;
        cartData[address + 2] = value & 0xff;
        value >>>= 8;
        cartData[address + 3] = value & 0xff;
    }

}