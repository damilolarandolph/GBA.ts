import MemoryAccessor from "./memory-accessor";
import MemoryMap from "./memory-map";

export class SystemMemory implements MemoryMap {

    private BIOS: MemoryMap;
    private WRAM: MemoryMap;
    private WRAM2: MemoryMap;
    private IOMap: MemoryMap;
    private GamePAK: MemoryMap;
    private videoController: MemoryMap;

    constructor(
        BIOS: MemoryMap,
        WRAM: MemoryMap,
        WRAM2: MemoryMap,
        IOMap: MemoryMap,
        GamePak: MemoryMap,
        videoController: MemoryMap
    ) {
        this.BIOS = BIOS;
        this.WRAM = WRAM;
        this.WRAM2 = WRAM2;
        this.IOMap = IOMap;
        this.GamePAK = GamePak;
        this.videoController = videoController;
    }


    // @ts-ignore: decorator
    @inline
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

        if (address >= 0x05000000 && address <= 0x07FFFFFF) {
            return this.videoController;
        }

        return this.GamePAK;
    }

    read32(address: u32, accessor: MemoryAccessor): u32 {
        return this.mapForAddress(address).read32(address, accessor);
    }

    read16(address: u32, accessor: MemoryAccessor): u16 {

        return this.mapForAddress(address).read16(address, accessor);
    }

    read8(address: u32, accessor: MemoryAccessor): u8 {
        return this.mapForAddress(address).read8(address, accessor);
    }

    write8(address: u32, accessor: MemoryAccessor, value: u8): void {
        this.mapForAddress(address).write8(address, accessor, value);
    }

    write16(address: u32, accessor: MemoryAccessor, value: u16): void {
        this.mapForAddress(address).write16(address, accessor, value);
    }

    write32(address: u32, accessor: MemoryAccessor, value: u32): void {
        this.mapForAddress(address).write32(address, accessor, value);
    }

}
