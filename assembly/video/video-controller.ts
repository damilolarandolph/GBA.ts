import InterruptManager from "../cpu/interrupt-manager";
import IODevice from "../io/io-device";
import memoryAccessor from "../memory/memory-accessor";
import MemoryMap from "../memory/memory-map";
import { OAM } from "./oam";
import PaletteRam from "./palette-ram";
import VRAM from "./vram";


enum BGModes {
    MODE_0,
    MODE_1,
    MODE_2,
    MODE_3,
    MODE_4,
    MODE_5
}

enum BGLayers {
    BG_0,
    BG_1,
    BG_2,
    BG_3,
}


@unmanaged
class MapEntry {
    tileNumber: u32;
    hFlip: bool;
    vFlip: bool;
    palNumber: u16;
}

export class VideoController implements IODevice, MemoryMap {

    private OAM: OAM;
    private VRAM: VRAM;
    private paletteRAM: PaletteRam;
    private registers: VideoUnitRegisters;
    private interruptManager: InterruptManager;
    private buffer1: Uint16Array = new Uint16Array(38400);
    private buffer2: Uint16Array = new Uint16Array(38400);
    private workingBuffer: number = 1;


    constructor(oam: OAM,
        vram: VRAM,
        paletteRAM: PaletteRam,
        interruptManager: InterruptManager,
        videoRegs: VideoUnitRegisters
    ) {
        this.OAM = oam;
        this.registers = videoRegs;
        this.VRAM = vram;
        this.paletteRAM = paletteRAM;
        this.interruptManager = interruptManager;
    }


    get mapEntry(): MapEntry {
        return new MapEntry();
    }



    get bitmapPixel(): u16 {
        return 1;
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
        //
    }
    readIO(address: u32): u32 {
        return 1;
    }

}

export class VideoUnitRegisters {

    set DISPCNT(value: u16) { }
    get DISPCNT(): u16 {
        return 1;
    }

    get mode(): BGModes { return 1 };


    set DISPSTAT(value: u16) { }
    get DISPSTAT(): u16 {
        return 1;
    }

    get VCOUNT(): u16 {
        return 1;
    }

    setBGCNT(layer: BGLayers, value: u16): void { }
    getBGCNT(layer: BGLayers): u16 { return 1; }

    setBGHOFS(layer: BGLayers, value: u16): void { }
    getBGHOFS(layer: BGLayers): u16 { return 1; }

    setBGVOFS(layer: BGLayers, value: u16): void { }
    getBGVOFS(layer: BGLayers): u16 { return 1; }

}
