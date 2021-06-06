import IODevice from "../io/io-device";
import memoryAccessor from "../memory/memory-accessor";
import MemoryMap from "../memory/memory-map";
import { OAM } from "./oam";
import PaletteRam from "./palette-ram";
import VRAM from "./vram";

export default class VideoController implements IODevice, MemoryMap {

    private OAM: OAM;
    private VRAM: VRAM;
    private paletteRAM: PaletteRam;

    constructor(oam: OAM, vram: VRAM, paletteRAM: PaletteRam) {
        this.OAM = oam;
        this.VRAM = vram;
        this.paletteRAM = paletteRAM;
    }

    private mapForAddress(address: u32): MemoryMap {
        if (address >= 0x05000000 && address <= 0x050003FF) {
            return this.paletteRAM;
        }

        if (address >= 0x06000000 && address <= 0x06017FFF) {
            return this.VRAM;
        }

        return this.OAM;
    }

    tick(): void {

    }

    read32(address: u32, accessor: memoryAccessor): u32 {
        return this.mapForAddress(address).read32(address, accessor);
    }
    read16(address: u32, accessor: memoryAccessor): u16 {
        return this.mapForAddress(address).read16(address, accessor);
    }
    read8(address: u32, accessor: memoryAccessor): u8 {
        return this.mapForAddress(address).read8(address, accessor);
    }
    write8(address: u32, accessor: memoryAccessor, value: u8): void {
        this.mapForAddress(address).write8(address, accessor, value);
    }
    write16(address: u32, accessor: memoryAccessor, value: u16): void {
        this.mapForAddress(address).write16(address, accessor, value);
    }
    write32(address: u32, accessor: memoryAccessor, value: u32): void {
        this.mapForAddress(address).write32(address, accessor, value);
    }
    writeIO(address: u32, value: u32): void {
        throw new Error("Method not implemented.");
    }
    readIO(address: u32): u32 {
        throw new Error("Method not implemented.");
    }

}