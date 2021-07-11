
export abstract class MemoryMapImpl implements MemoryMap {

    protected data: Uint8Array;
    protected addressOffset: u32;

    constructor(data: Uint8Array, addressOffset: u32) {
        this.data = data;
        this.addressOffset = addressOffset;
    }

    read32(address: u32): u32 {
        address -= this.addressOffset;
        let byte1: u32 = this.data[address];
        let byte2: u32 = this.data[address + 1];
        let byte3: u32 = this.data[address + 2];
        let byte4: u32 = this.data[address + 3]
        return (byte1 << 24) | (byte2 << 16) | (byte3 << 8) | (byte4);
    }

    read16(address: u32): u16 {
        address -= this.addressOffset;
        let byte1: u16 = this.data[address];
        let byte2: u16 = this.data[address + 2];
        return (byte1 << 8) | byte2;
    };

    read8(address: u32): u8 {
        address -= this.addressOffset;
        return this.data[address];
    };

    write8(address: u32, value: u8): void {
        address -= this.addressOffset;
        this.data[address] = value;
    }

    write16(address: u32, value: u16): void {
        this.data[address] = u8(value);
        value = value >>> 8;
        this.data[address + 1] = u8(value);
    }

    write32(address: u32, value: u32): void {
        this.data[address] = u8(value);
        value = value >>> 8;
        this.data[address + 1] = u8(value);
        value = value >>> 8;
        this.data[address + 2] = u8(value);
        value = value >>> 8;
        this.data[address + 3] = u8(value);
    }
}


export interface MemoryMap {
    read32(address: u32): u32

    read16(address: u32): u16

    read8(address: u32): u8

    write8(address: u32, value: u8): void

    write16(address: u32, value: u16): void

    write32(address: u32, value: u32): void
}


