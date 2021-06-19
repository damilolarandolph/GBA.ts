import MemoryAccessor from "../memory/memory-accessor";
import MemoryMap from "../memory/memory-map";

// 32 MB cartridge;
// @ts-ignore: decorator
export const cartData = new Uint8Array(32000000);
export default class GamePak implements MemoryMap {


    read32(address: u32, accessor: MemoryAccessor): u32 {
        address -= 0x08000000;
        if (address >= 32000000) {
            trace("Address to large", 1, address);
        }
        let byte1: u32 = cartData[address];
        let byte2: u32 = cartData[address + 1];
        let byte3: u32 = cartData[address + 2];
        let byte4: u32 = cartData[address + 3];
        trace("Byte1", 1, byte1);
        trace("Byte2", 1, byte2);
        trace("Byte3", 1, byte3);
        trace("Byte4", 1, byte4);
        let data: u32 = (byte4 << 24) | (byte3 << 16) | (byte2 << 8) | byte1;
        return data;
    }

    read16(address: u32, accessor: MemoryAccessor): u16 {
        let byte1: u32 = cartData[address];
        let byte2: u32 = cartData[address + 1];
        let data: u16 = u16((byte2 << 8) | byte1);
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