import MemoryAccessor from "./memory-accessor";
import MemoryMap from "./memory-map";

//256K On board WRAM
export class WRAM1 implements MemoryMap {
    private data: Uint8Array = new Uint8Array(256000);
    private startAddr: u32 = 0x02000000;

    read32(address: u32, accessor: MemoryAccessor): u32 {
        address -= this.startAddr;
        let byte1 = this.data[address];
        let byte2 = this.data[address + 1];
        let byte3 = this.data[address + 2];
        let byte4 = this.data[address + 3];
        let data = (byte4 << 24) | (byte3 << 16) | (byte2 << 8) | byte1;
        return data;
    }

    read16(address: u32, accessor: MemoryAccessor): u16 {
        address -= this.startAddr
        let byte1 = this.data[address];
        let byte2 = this.data[address + 1];
        let data = (byte2 << 8) | byte1;
        return data;
    }

    read8(address: u32, accessor: MemoryAccessor): u8 {
        address -= this.startAddr;
        return this.data[address];
    }

    write8(address: u32, accessor: MemoryAccessor, value: u8): void {
        address -= this.startAddr;
        this.data[address] = value;
    }

    write16(address: u32, accessor: MemoryAccessor, value: u16): void {
        address -= this.startAddr;
        this.data[address] = value & 0xff;
        value >>>= 8;
        this.data[address + 1] = value & 0xff;
    }

    write32(address: u32, accessor: MemoryAccessor, value: u32): void {
        address -= this.startAddr;
        this.data[address] = value & 0xff;
        value >>>= 8;
        this.data[address + 1] = value & 0xff;
        value >>>= 8;
        this.data[address + 2] = value & 0xff;
        value >>>= 8;
        this.data[address + 3] = value & 0xff;
    }
}

// 32KB Onchip WRAM
export class WRAM2 implements MemoryMap {

    private data: Uint8Array = new Uint8Array(32768);
    private startAddr: u32 = 0x03000000;

    read32(address: u32, accessor: MemoryAccessor): u32 {
        address -= this.startAddr;
        let byte1: u32 = this.data[address];
        let byte2: u32 = this.data[address + 1];
        let byte3: u32 = this.data[address + 2];
        let byte4: u32 = this.data[address + 3];
        let data: u32 = (byte4 << 24) | (byte3 << 16) | (byte2 << 8) | byte1;
        return data;
    }

    read16(address: u32, accessor: MemoryAccessor): u16 {
        address -= this.startAddr
        let byte1: u16 = this.data[address];
        let byte2: u16 = this.data[address + 1];
        let data: u16 = (byte2 << 8) | byte1;
        return data;
    }

    read8(address: u32, accessor: MemoryAccessor): u8 {
        address -= this.startAddr;
        return this.data[address];
    }

    write8(address: u32, accessor: MemoryAccessor, value: u8): void {
        address -= this.startAddr;
        this.data[address] = value;
    }

    write16(address: u32, accessor: MemoryAccessor, value: u16): void {
        address -= this.startAddr;
        this.data[address] = value & 0xff;
        value >>>= 8;
        this.data[address + 1] = value & 0xff;
    }

    write32(address: u32, accessor: MemoryAccessor, value: u32): void {
        address -= this.startAddr;
        this.data[address] = value & 0xff;
        value >>>= 8;
        this.data[address + 1] = value & 0xff;
        value >>>= 8;
        this.data[address + 2] = value & 0xff;
        value >>>= 8;
        this.data[address + 3] = value & 0xff;
    }
}