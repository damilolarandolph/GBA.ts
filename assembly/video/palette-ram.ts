import MemoryAccessor from "../memory/memory-accessor";
import { MemoryMap } from "../memory/memory-map";

class PaletteRam extends MemoryMap {
    // 1K ?
    private data: Uint8Array = new Uint8Array(1000);

    read32(address: u32, accessor: MemoryAccessor): u32 {
        let byte1 = this.data[address];
        let byte2 = this.data[address + 1];
        let byte3 = this.data[address + 2];
        let byte4 = this.data[address + 3];
        let data = (byte4 << 24) | (byte3 << 16) | (byte2 << 8) | byte1;
        return data;
    }

    read16(address: u32, accessor: MemoryAccessor): u16 {
        let byte1 = this.data[address];
        let byte2 = this.data[address + 1];
        let data = (byte2 << 8) | byte1;
        return data;
    }

    read8(address: u32, accessor: MemoryAccessor): u8 {
        return this.data[address];
    }

    write8(address: u32, accessor: MemoryAccessor, value: u8): void {
        this.data[address] = value;
    }

    write16(address: u32, accessor: MemoryAccessor, value: u16): void {
        this.data[address] = value & 0xff;
        value >>>= 8;
        this.data[address + 1] = value & 0xff;
    }

    write32(address: u32, accessor: MemoryAccessor, value: u32): void {
        this.data[address] = value & 0xff;
        value >>>= 8;
        this.data[address + 1] = value & 0xff;
        value >>>= 8;
        this.data[address + 2] = value & 0xff;
        value >>>= 8;
        this.data[address + 3] = value & 0xff;
    }
}