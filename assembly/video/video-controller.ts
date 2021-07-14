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

enum BGLayers {
    BG_0,
    BG_1,
    BG_2,
    BG_3,
    OBJ,
}

enum WindowLayers {
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
    writeIO(address: u32, value: u32): void {
        throw new Error("Method not implemented.");
    }
    readIO(address: u32): u32 {
        throw new Error("Method not implemented.");
    }


    get mapEntry(): MapEntry {
        return new MapEntry();
    }



    get bitmapPixel(): u16 {
        return 1;
    }


    drawLine(): void {

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

export class VideoUnitRegisters {

    private backingArray: StaticArray<u8> = new StaticArray<u8>(86);
    public arrayPointer: usize;
    public displayControl: DISPCNT;
    public dispStatus: DISPSTAT;

    constructor() {
        this.arrayPointer = changetype<usize>(this.backingArray);
        this.displayControl = new DISPCNT(this.arrayPointer);
        this.dispStatus = new DISPSTAT(this.arrayPointer + 0x4);
    }





}

class DISPCNT {
    private dataPtr: usize;

    constructor(pointer: usize) {
        this.dataPtr = pointer;
    }

    get mode(): BGModes {
        return load<u8>(this.dataPtr) & 0x7;
    }

    get frameSelect(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x10) != 0;
    }

    get HblankInterval(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x20) != 0;
    }

    get isOBJ2D(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x40) != 0;
    }

    get forcedBlank(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x80) != 0;
    }

    isDisplay(layer: BGLayers): boolean {
        let data = load<u8>(this.dataPtr + 1);
        let mask = 0x1;
        mask <<= layer;
        return (data & mask) != 0
    }

    isWindow(window: WindowLayers): boolean {
        let data = load<u8>(this.dataPtr + 1);
        let mask = 0x10;
        mask <<= window;
        return (data & mask) != 0
    }

    get isOBJWindow(): boolean {
        let data = load<u8>(this.dataPtr + 1);
        return (data & 0x80) != 0;
    }
}

class DISPSTAT {
    private dataPtr: usize;

    constructor(pointer: usize) {
        this.dataPtr = pointer;
    }


    get vBlank(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x1) != 0;
    }

    set vBlank(val: boolean) {
        let data = load<u8>(this.dataPtr);
        data >>>= 1;
        data <<= 1;
        if (val) {
            data |= 0x1;
        }
        store<u8>(this.dataPtr, data);
    }

    get hBlank(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x2) != 0;
    }

    set hBlank(val: boolean) {
        let data = load<u8>(this.dataPtr);
        if (val) {
            data |= 0x2;
        } else {
            // 1111101 (0x7D)
            data &= 0xFD;
        }
        store<u8>(this.dataPtr, data);
    }

    get vCountFlag(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x4) != 0;
    }

    set vCountFlag(val: boolean) {
        let data = load<u8>(this.dataPtr);
        if (val) {
            data |= 0x4
        } else {
            data &= 0xFB;
        }
        store<u8>(this.dataPtr, data);
    }

    get vBlankIRQ(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x8) != 0;
    }

    get hBlankIRQ(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x10) != 0;
    }

    get vCountIRQ(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x20) != 0;
    }

    get LY(): u8 {
        let data = load<u8>(this.dataPtr + 1);
        return data;
    }

    set LY(val: u8) {
        store<u8>(this.dataPtr + 1, val);
    }
}


class BGControl {
    private dataPtr: usize;

    constructor(pointer: usize) {
        this.dataPtr = pointer;
    }

    get priority(): u8 {
        let data = load<u8>(this.dataPtr);
        return u8(data & 0x3)
    }

    get charBaseBlock(): u8 {
        let data = load<u8>(this.dataPtr);
        data >>= 2;
        return u8(data & 0x3);
    }

    get mosaic(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x40) != 0;
    }

    get is16Palette(): boolean {
        let data = load<u8>(this.dataPtr);
        return (data & 0x80) != 0;
    }

    get screenBaseBlock(): u8 {

    }

}
