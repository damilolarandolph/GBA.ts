import { BGLayers, BGModes, WindowLayers } from "./video-controller";


export class VideoUnitRegisters {

    private backingArray: StaticArray<u8> = new StaticArray<u8>(86);
    public arrayPointer: usize;
    public displayControl: DISPCNT;
    public dispStatus: DISPSTAT;
    public bgControl: StaticArray<BGRegs> = new StaticArray<BGRegs>(4);
    public windowRegs: WindowRegs;

    constructor() {
        this.arrayPointer = changetype<usize>(this.backingArray);
        this.displayControl = new DISPCNT(this.arrayPointer);
        this.dispStatus = new DISPSTAT(this.arrayPointer + 0x4);
        this.bgControl[BGLayers.BG_0] = new BGRegs(this.arrayPointer + 0x8, this.arrayPointer + 0x10);
        this.bgControl[BGLayers.BG_1] = new BGRegs(this.arrayPointer + 0xA, this.arrayPointer + 0x14);
        this.bgControl[BGLayers.BG_2] = new BGRegs(this.arrayPointer + 0xC, this.arrayPointer + 0x18, this.arrayPointer + 0x20);
        this.bgControl[BGLayers.BG_3] = new BGRegs(this.arrayPointer + 0xE, this.arrayPointer + 0x1C, this.arrayPointer + 0x30);
        this.windowRegs = new WindowRegs(this.arrayPointer + 0x40);
    }



}

export class DISPCNT {
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

export class DISPSTAT {
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


export class BGRegs {
    private dataPtr: usize;
    private scrollPtr: usize;
    private rotScalePtr: usize;

    constructor(
        pointer: usize,
        scrollPtr: usize,
        rotSclePtr: usize = -1
    ) {
        this.dataPtr = pointer;
        this.scrollPtr = scrollPtr;
        this.rotScalePtr = rotSclePtr;
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
        let data = load<u8>(this.dataPtr + 1);
        return u8(data & 0x10);
    }

    get displayAreaWrap(): boolean {
        let data = load<u8>(this.dataPtr + 1);
        data >>>= 5;
        return (data & 0x1) != 0;
    }

    get screenSize(): u8 {
        let data = load<u8>(this.dataPtr + 1);
        data >>>= 6;
        return u8(data & 0x3);
    }

    get HOFS(): u8 {
        let data = load<u8>(this.scrollPtr);
        return u8(data);
    }

    get VOFS(): u8 {
        let data = load<u8>(this.scrollPtr + 2);
        return u8(data);
    }

    get xReference(): f32 {
        let data = load<u32>(this.rotScalePtr + 8);
        let fractional = u8(data & 0xFF);
        let integer = u32((data >>> 8) & 0x7FFFF);
        let sign = (data & 0x8000000) != 0;

        // is this correct ?
        let float = f32(integer) + (f32(fractional) / 1000);
        return copysign<f32>(float, sign ? -1.0 : 1.0);
    }

    get yReference(): f32 {
        let data = load<u32>(this.rotScalePtr + 0xC);
        let fractional = u8(data & 0xFF);
        let integer = u32((data >>> 8) & 0x7FFFF);
        let sign = (data & 0x8000000) != 0;

        // is this correct ?
        let float = f32(integer) + (f32(fractional) / 1000);
        return copysign<f32>(float, sign ? -1.0 : 1.0);
    }

    get dx(): f32 {
        let data = load<u16>(this.rotScalePtr);
        let fractional = u8(data & 0xff);
        let integer = u8((data >>> 8) & 0x7f);
        let sign = (data & 0x8000) != 0;
        // is this correct ?
        let float = f32(integer) + (f32(fractional) / 1000);
        return copysign<f32>(float, sign ? -1.0 : 1.0);
    }

    // RIP
    get dmx(): f32 {
        let data = load<u32>(this.rotScalePtr + 2);
        let fractional = u8(data & 0xff);
        let integer = u8((data >>> 8) & 0x7f);
        let sign = (data & 0x8000) != 0;
        // is this correct ?
        let float = f32(integer) + (f32(fractional) / 1000);
        return copysign<f32>(float, sign ? -1.0 : 1.0);
    }

    get dy(): f32 {
        let data = load<u32>(this.rotScalePtr + 4);
        let fractional = u8(data & 0xff);
        let integer = u8((data >>> 8) & 0x7f);
        let sign = (data & 0x8000) != 0;
        // is this correct ?
        let float = f32(integer) + (f32(fractional) / 1000);
        return copysign<f32>(float, sign ? -1.0 : 1.0);
    }

    get dmy(): f32 {
        let data = load<u32>(this.rotScalePtr + 6);
        let fractional = u8(data & 0xff);
        let integer = u8((data >>> 8) & 0x7f);
        let sign = (data & 0x8000) != 0;
        // is this correct ?
        let float = f32(integer) + (f32(fractional) / 1000);
        return copysign<f32>(float, sign ? -1.0 : 1.0);
    }
}


@unmanaged
export class Dimension {
    rightX: u8 = 0;
    leftX: u8 = 0;
    topY: u8 = 0;
    bottomY: u8 = 0;
};


class WindowRegs {
    private dataPtr: usize;

    constructor(pointer: usize) {
        this.dataPtr = pointer;
    }

    getDimensions(window: WindowLayers): Dimension {
        let pointer: usize = this.dataPtr;
        if (window == WindowLayers.WINDOW_1) {
            pointer += 2;
        }
        let horizontal = load<u16>(pointer);
        pointer += 4;
        let vertical = load<u16>(pointer);

        let rightX = u8(horizontal & 0xff) + 1;
        let leftX = u8((horizontal >>> 8) & 0xff);
        let bottomY = u8(vertical & 0xff) + 1;
        let topY = u8((vertical >>> 8) & 0xff);

        return { rightX, leftX, bottomY, topY };
    }


    windowBGEnable(window: WindowLayers, bgLayer: BGLayers): boolean {
        let pointer: usize = this.dataPtr + 8;
        if (window == WindowLayers.WINDOW_1) {
            pointer += 1;
        }
        let data = load<u8>(pointer);
        data >>= bgLayer;
        return (data & 0x1) != 0;
    }

    objEnable(window: WindowLayers): boolean {
        let pointer: usize = this.dataPtr + 8;
        if (window == WindowLayers.WINDOW_1) {
            pointer += 1;
        }
        let data = load<u8>(pointer);
        return (data & 0x10) != 0;
    }

    colorSpecialEnable(window: WindowLayers): boolean {
        let pointer: usize = this.dataPtr + 8;
        if (window == WindowLayers.WINDOW_1) {
            pointer += 1;
        }
        let data = load<u8>(pointer);
        return (data & 0x20) != 0
    }


    windowBGEnableOut(isObj: boolean, bgLayer: BGLayers): boolean {
        let pointer: usize = this.dataPtr + 0xA;
        if (isObj) {
            pointer += 1;
        }
        let data = load<u8>(pointer);
        data >>= bgLayer;
        return (data & 0x1) != 0;
    }

    objEnableOut(isObj: boolean): boolean {
        let pointer: usize = this.dataPtr + 8;
        if (isObj) {
            pointer += 1;
        }
        let data = load<u8>(pointer);
        return (data & 0x10) != 0;
    }

    colorSpecialEnableOut(isObj: boolean): boolean {
        let pointer: usize = this.dataPtr + 8;
        if (isObj) {
            pointer += 1;
        }
        let data = load<u8>(pointer);
        return (data & 0x20) != 0
    }

}
