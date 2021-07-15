import InterruptManager from "../cpu/interrupt-manager";
import IODevice from "../io/io-device";
import { OAM } from "./oam";
import PaletteRam from "./palette-ram";
import { VideoUnitRegisters } from "./VideoUnitRegisters";
import VRAM from "./vram";


export enum BGModes {
    MODE_0,
    MODE_1,
    MODE_2,
    MODE_3,
    MODE_4,
    MODE_5
}
enum IORegions {
    DISPCNT = 0x4000000,
    DISPSTAT = 0x4000004,
    VCOUNT = 0x4000006,
    BGCNT = 0x4000008,
    BGHOVOFS = 0x4000010,
    BG2X_LH = 0x4000028,
    BG2P = 0x4000020,
    BG3P = 0x400003,
}

export enum BGLayers {
    BG_0,
    BG_1,
    BG_2,
    BG_3,
    OBJ,
}

export enum WindowLayers {
    WINDOW_0,
    WINDOW_1,
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
    private writeBuffer: Uint16Array = new Uint16Array(38400);
    private readBuffer: Uint16Array = new Uint16Array(38400);
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
    writeIO(address: u32, value: u8): void {
        address &= 0x3FFFFFF;
        let pointer = this.registers.arrayPointer + address;
        store<u8>(pointer, value);
    }
    readIO(address: u32): u8 {
        address &= 0x3FFFFFF;
        let pointer = this.registers.arrayPointer + address;
        return load<u8>(pointer);
    }

    drawLine(): void {

        switch (this.registers.displayControl.mode) {
            case BGModes.MODE_0:
                this.drawMode0Line();
                break;
            case BGModes.MODE_1:
                this.drawMode1Line();
                break;
            case BGModes.MODE_2:
                this.drawMode2Line();
                break;
            case BGModes.MODE_3:
                this.drawMode3Line();
                break;
            case BGModes.MODE_4:
                this.drawMode4Line();
                break;
            case BGModes.MODE_5:
                this.drawMode5Line();
                break;

        }

    }

    private drawMode0Line(): void {

    }

    private drawMode1Line(): void {

    }

    private drawMode2Line(): void {

    }


    private drawMode3Line(): void {

    }

    private drawMode4Line(): void {



    }

    private drawMode5Line(): void {

    }


    tick(): void {

    }




}


