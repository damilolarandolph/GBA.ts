
export abstract class MemoryMapImpl implements MemoryMap {

    protected data: Uint8Array;
    protected addressOffset: u32;
    protected pointer: usize;

    constructor(data: Uint8Array, addressOffset: u32) {
        this.data = data;
        this.addressOffset = addressOffset;
        this.pointer = changetype<usize>(data.buffer);
    }

    read32(address: u32): u32 {
        address -= this.addressOffset;
        let word: u32 = load<u32>(this.pointer + address);
        return word;
    }

    read16(address: u32): u16 {
        address -= this.addressOffset;
        let halfWord: u16 = load<u16>(this.pointer + address);
        return halfWord;
    };

    read8(address: u32): u8 {
        address -= this.addressOffset;
        return load<u8>(this.pointer + address);
    };

    write8(address: u32, value: u8): void {
        address -= this.addressOffset;
        store<u8>(this.pointer + address, value);
        return;
    }

    write16(address: u32, value: u16): void {
        address -= this.addressOffset;
        store<u16>(this.pointer + address, value);
        return;
    }

    write32(address: u32, value: u32): void {
        address -= this.addressOffset;
        store<u32>(this.pointer + address, value);
        return;
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


