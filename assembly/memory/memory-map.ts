
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
        let data: u32 = (byte4 << 24) | (byte3 << 16) | (byte2 << 8) | byte1;
        return data;
    }

    read16(address: u32): u16 {
        address -= this.addressOffset;
        let byte1: u16 = this.data[address];
        let byte2: u16 = this.data[address + 1];
        let data: u16 = (byte2 << 8) | byte1;
        return data;
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
        address -= this.addressOffset;
        this.data[address] = value & 0xff;
        value >>>= 8
        this.data[address + 1] = value & 0xff;
    }

    write32(address: u32, value: u32): void {
        address -= this.addressOffset;
        this.data[address] = value & 0xff;
        value >>>= 8;
        this.data[address + 1] = value & 0xff;
        value >>>= 8;
        this.data[address + 2] = value & 0xff;
        value >>>= 8;
        this.data[address + 3] = value & 0xff;
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


