import InterruptManager from "../cpu/interrupt-manager";
import IODevice from "../io/io-device";
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


const buffer1: Uint16Array = new Uint16Array(38400);
const buffer2: Uint16Array = new Uint16Array(38400);


export class VideoController implements IODevice {

    public OAM: OAM;
    public VRAM: VRAM;
    public paletteRAM: PaletteRam;
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




    tick(): void {

    }

    getBuffer(no: i32): Uint16Array {
        if (no == 1) {
            return this.buffer1;
        } else {
            return this.buffer2;
        }
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
