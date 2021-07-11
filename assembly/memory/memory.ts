import { MemoryMap } from "./memory-map";

export class SystemMemory {

    private BIOS: MemoryMap;
    private WRAM: MemoryMap;
    private WRAM2: MemoryMap;
    private IOMap: MemoryMap;
    private GamePAK: MemoryMap;
    private paletteRAM: MemoryMap;
    private VRAM: MemoryMap;
    private OAM: MemoryMap;

    constructor(
        BIOS: MemoryMap,
        WRAM: MemoryMap,
        WRAM2: MemoryMap,
        IOMap: MemoryMap,
        GamePak: MemoryMap,
        paletteRAM: MemoryMap,
        VRAM: MemoryMap,
        OAM: MemoryMap,
    ) {
        this.BIOS = BIOS;
        this.WRAM = WRAM;
        this.WRAM2 = WRAM2;
        this.IOMap = IOMap;
        this.GamePAK = GamePak;
        this.paletteRAM = paletteRAM;
        this.VRAM = VRAM;
        this.OAM = OAM;
    }


    // @ts-ignore: decorator
    private mapForAddress(address: u32): MemoryMap {
        if (address >= 0 && address <= 0x00003FFF) {
            return this.BIOS;
        }

        if (address >= 0x02000000 && address <= 0x0203FFFF) {
            return this.WRAM;
        }

        if (address >= 0x03000000 && address <= 0x03007FFF) {
            return this.WRAM2;
        }

        if (address >= 0x04000000 && address <= 0x040003FE) {
            return this.IOMap;
        }

        if (address >= 0x05000000 && address <= 0x050003FF) {
            return this.paletteRAM;
        }

        if (address >= 0x06000000 && address <= 0x06017FFF) {
            return this.VRAM;
        }

        if (address >= 0x07000000 && address <= 0x070003FF) {
            return this.OAM;
        }

        if (address >= 0x08000000 && address <= 0x09FFFFFF) {
            return this.GamePAK;
        }
        let a = 10;
        trace("unknown", 1, address);
        return this.GamePAK;
    }

    read32(address: u32): u32 {
        return this.mapForAddress(address).read32(address);
    }

    read16(address: u32): u16 {

        return this.mapForAddress(address).read16(address);
    }

    read8(address: u32): u8 {
        return this.mapForAddress(address).read8(address);
    }

    write8(address: u32, value: u8): void {
        this.mapForAddress(address).write8(address, value);
    }

    write16(address: u32, value: u16): void {
        this.mapForAddress(address).write16(address, value);
    }

    write32(address: u32, value: u32): void {
        this.mapForAddress(address).write32(address, value);
    }

}
