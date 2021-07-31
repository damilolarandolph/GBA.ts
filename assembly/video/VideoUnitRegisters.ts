import { getBit, getBits, setBit } from "../utils/bits";
import { BGLayers, WindowLayers } from "./video-controller";


@unmanaged
export class Dimension {
    rightX: u32 = 0;
    leftX: u32 = 0;
    topY: u32 = 0;
    bottomY: u32 = 0;

    public containsPoint(x: u32, y: u32): boolean {

        return (x >= this.leftX && x <= this.rightX) && (y >= this.topY && y <= this.bottomY);

    }
};

enum IORegions {
    DISPCNT = 0x0,
    DISPSTAT = 0x4,
    BG0CNT = 0x8,
    BG1CNT = 0xA,
    BG2CNT = 0xC,
    BG3CNT = 0xE,
    BG0SCROLL = 0x10,
    BG1SCROLL = 0x14,
    BG2SCROLL = 0x18,
    BG3SCROLL = 0xC,
    WIN0H = 0x40,
    WIN0V = 0x44,
    WIN1H = 0x42,
    WIN1V = 0x46,
    WININ = 0x48,
    WINOUT = 0x4A,
}



export class BGCNT {
    priority: u8 = 0;
    characterBaseBlock: u8 = 0;
    mosaic: boolean = false;
    palette256: boolean = false;
    screenBaseBlock: u8 = 0;
    overflowWrap: boolean = false;
    screenSize: u8 = 0;
    hofs: u8 = 0;
    vofs: u8 = 0;

    readCNT(byte: i32): u8 {
        let result: u8 = 0;
        if (byte == 1) {
            result |= this.priority;
            result |= (this.characterBaseBlock << 2);
            result = <u8>setBit(result, 6, this.mosaic);
            result = <u8>setBit(result, 7, this.palette256);
        } else {
            result &= this.screenBaseBlock;
            result = <u8>setBit(result, 5, this.overflowWrap);
            result |= (this.screenSize << 6);
        }
        return result;
    }

    writeCNT(byte: i32, value: u8): void {
        if (byte == 1) {
            this.priority = value & 0x3;
            this.characterBaseBlock = <u8>getBits(value, 3, 2);
            this.mosaic = getBit(value, 6);
            this.palette256 = getBit(value, 7);
        } else {
            this.screenBaseBlock = value & 0xf;
            this.overflowWrap = getBit(value, 5);
            this.screenSize = <u8>getBits(value, 7, 6);
        }
    }

}

export class Window {
    bg0Enable: boolean = false;
    bg1Enable: boolean = false;
    bg2Enable: boolean = false;
    bg3Enable: boolean = false;
    objEnable: boolean = false;
    effectsEnable: boolean = false;
    dimensions: Dimension = new Dimension();

    isBG(layer: u32): boolean {
        switch (layer) {
            case BGLayers.BG_0:
                return this.bg0Enable;
            case BGLayers.BG_1:
                return this.bg1Enable;
            case BGLayers.BG_2:
                return this.bg2Enable;
            case BGLayers.BG_3:
                return this.bg3Enable;
        }
        return false;
    }

    write(value: u8): void {
        this.bg0Enable = getBit(value, 0);
        this.bg1Enable = getBit(value, 1);
        this.bg2Enable = getBit(value, 2);
        this.bg3Enable = getBit(value, 3);
        this.objEnable = getBit(value, 4);
        this.effectsEnable = getBit(value, 5);
    }

    read(): u8 {
        let result: u8 = 0;
        result = <u8>setBit(result, 0, this.bg0Enable);
        result = <u8>setBit(result, 1, this.bg1Enable);
        result = <u8>setBit(result, 2, this.bg2Enable);
        result = <u8>setBit(result, 3, this.bg3Enable);
        result = <u8>setBit(result, 4, this.objEnable);
        result = <u8>setBit(result, 5, this.effectsEnable);
        return result;
    }
}


export class GPURegisters {

    // DISPCNT
    BGMODE: u8 = 0;
    frameSelect: boolean = false;
    hBlankIntervalFree: boolean = false;
    objMap1D: boolean = false;
    forcedBlank: boolean = false;
    private bg0Enable: boolean = false;
    private bg1Enable: boolean = false;
    private bg2Enable: boolean = false;
    private bg3Enable: boolean = false;
    objEnable: boolean = false;
    private window0Enable: boolean = false;
    private window1Enable: boolean = false;
    private objWindowEnable: boolean = false;
    bg: StaticArray<BGCNT> = new StaticArray(4);
    win: StaticArray<Window> = new StaticArray(4);

    constructor() {
        this.bg[0] = this.bg0;
        this.bg[1] = this.bg1;
        this.bg[2] = this.bg2;
        this.bg[3] = this.bg3;
        this.win[0] = this.win0;
        this.win[1] = this.win1;
        this.win[2] = this.objWin;
        this.win[3] = this.winOut;
    }


    // DISPSTAT
    vBlankFlag: boolean = false;
    hBlankFlag: boolean = false;
    vCounterFlag: boolean = false;
    vBlankIRQEnable: boolean = false;
    hBlankIRQEnable: boolean = false;
    vCounterIRQEnable: boolean = false;
    vCountSetting: u8 = 0;
    ly: u32 = 0;


    // BG CONTROLS
    private bg0: BGCNT = new BGCNT();
    private bg1: BGCNT = new BGCNT();
    private bg2: BGCNT = new BGCNT();
    private bg3: BGCNT = new BGCNT();


    // Window Controls
    private win0: Window = new Window();
    private win1: Window = new Window();
    private objWin: Window = new Window();
    private winOut: Window = new Window();

    isWindow(windowLayer: WindowLayers): boolean {
        switch (windowLayer) {
            case WindowLayers.WINDOW_0:
                return this.window0Enable;
            case WindowLayers.WINDOW_1:
                return this.window1Enable;
            case WindowLayers.OBJ:
                return this.objWindowEnable;
        }
        return false;
    }

    isBG(layer: BGLayers): boolean {
        switch (layer) {
            case BGLayers.BG_0:
                return this.bg0Enable;
            case BGLayers.BG_1:
                return this.bg1Enable;
            case BGLayers.BG_2:
                return this.bg2Enable;
            case BGLayers.BG_3:
                return this.bg3Enable;
        }

        return false;
    }



    public write(index: u32, value: u8): void {
        let currBG: BGCNT;
        switch (index) {
            case IORegions.DISPCNT:
                this.BGMODE = <u8>getBits(value, 2, 0);
                this.frameSelect = getBit(value, 4);
                this.hBlankIntervalFree = getBit(value, 5);
                this.objMap1D = getBit(value, 6);
                this.forcedBlank = getBit(value, 7);
                break;
            case IORegions.DISPCNT + 1:
                this.bg0Enable = getBit(value, 0);
                this.bg1Enable = getBit(value, 1);
                this.bg2Enable = getBit(value, 2);
                this.bg3Enable = getBit(value, 3);
                this.objEnable = getBit(value, 4);
                this.window0Enable = getBit(value, 5);
                this.window1Enable = getBit(value, 6);
                this.objWindowEnable = getBit(value, 7);
                break;
            case IORegions.DISPSTAT:
                this.vBlankIRQEnable = getBit(value, 3);
                this.hBlankIRQEnable = getBit(value, 4);
                this.vCounterIRQEnable = getBit(value, 5);
                break;
            case IORegions.DISPSTAT + 1:
                this.vCountSetting = value;
                break;
            case IORegions.BG0CNT:
                this.bg0.writeCNT(1, value);
                break;
            case IORegions.BG0CNT + 1:
                this.bg0.writeCNT(2, value);
                break;
            case IORegions.BG1CNT:
                this.bg1.writeCNT(1, value);
                break;
            case IORegions.BG1CNT + 1:
                this.bg1.writeCNT(2, value);
                break;
            case IORegions.BG2CNT:
                this.bg2.writeCNT(1, value);
                break;
            case IORegions.BG2CNT + 1:
                this.bg2.writeCNT(2, value);
                break;
            case IORegions.BG3CNT:
                this.bg3.writeCNT(1, value);
                break;
            case IORegions.BG3CNT + 1:
                this.bg3.writeCNT(2, value);
                break;
            case IORegions.BG0SCROLL:
                this.bg0.hofs = value;
                break;
            case IORegions.BG0SCROLL + 2:
                this.bg0.vofs = value;
                break;
            case IORegions.BG1SCROLL:
                this.bg1.hofs = value;
                break;
            case IORegions.BG1SCROLL + 2:
                this.bg1.vofs = value;
                break;
            case IORegions.BG2SCROLL:
                this.bg2.hofs = value;
                break;
            case IORegions.BG2SCROLL + 2:
                this.bg2.vofs = value;
                break;
            case IORegions.BG3SCROLL:
                this.bg3.hofs = value;
                break;
            case IORegions.BG3SCROLL + 2:
                this.bg3.vofs = value;
                break;
            case IORegions.WIN0H:
                this.win0.dimensions.leftX = value;
                break;
            case IORegions.WIN0H + 1:
                this.win0.dimensions.rightX = value;
                break;
            case IORegions.WIN1H:
                this.win1.dimensions.leftX = value;
                break;
            case IORegions.WIN1H + 1:
                this.win1.dimensions.rightX = value;
                break;
            case IORegions.WIN0V:
                this.win0.dimensions.bottomY = value;
                break;
            case IORegions.WIN0V + 1:
                this.win0.dimensions.topY = value;
                break;
            case IORegions.WIN1V:
                this.win1.dimensions.bottomY = value;
                break;
            case IORegions.WIN1V + 1:
                this.win1.dimensions.topY = value;
                break;
            case IORegions.WININ:
                this.win0.write(value);
                break;
            case IORegions.WININ + 1:
                this.win1.write(value);
                break;
            case IORegions.WINOUT:
                this.winOut.write(value);
                break;
            case IORegions.WINOUT + 1:
                this.objWin.write(value);
                break;
        }
    };

    public read(index: u32): u8 {
        let result: u32 = 0;
        switch (index) {
            case IORegions.DISPCNT:
                result &= this.BGMODE;
                result = setBit(result, 4, this.frameSelect);
                result = setBit(result, 5, this.hBlankIntervalFree);
                result = setBit(result, 6, this.objMap1D);
                result = setBit(result, 7, this.forcedBlank);
                break;
            case IORegions.DISPCNT + 1:
                result = setBit(result, 0, this.bg0Enable);
                result = setBit(result, 1, this.bg1Enable);
                result = setBit(result, 2, this.bg2Enable);
                result = setBit(result, 3, this.bg3Enable);
                result = setBit(result, 4, this.objEnable);
                result = setBit(result, 5, this.window0Enable);
                result = setBit(result, 6, this.window1Enable);
                result = setBit(result, 7, this.objWindowEnable);
                break;
            case IORegions.DISPSTAT:
                result = setBit(result, 0, this.vBlankFlag);
                result = setBit(result, 1, this.hBlankFlag);
                result = setBit(result, 2, this.vCounterFlag);
                result = setBit(result, 3, this.vBlankIRQEnable);
                result = setBit(result, 4, this.hBlankIRQEnable);
                result = setBit(result, 5, this.vCounterIRQEnable);
                break;
            case IORegions.DISPSTAT + 1:
                result = this.vCountSetting;
                break;
            case IORegions.DISPSTAT + 2:
                result = <u8>this.ly;
                break;
            case IORegions.BG0CNT:
                result = this.bg0.readCNT(1);
                break;
            case IORegions.BG0CNT + 1:
                result = this.bg0.readCNT(2);
                break;
            case IORegions.BG1CNT:
                result = this.bg1.readCNT(1);
                break;
            case IORegions.BG1CNT + 1:
                result = this.bg1.readCNT(2);
                break;
            case IORegions.BG2CNT:
                result = this.bg2.readCNT(1);
                break;
            case IORegions.BG2CNT + 1:
                result = this.bg2.readCNT(2);
                break;
            case IORegions.BG3CNT:
                result = this.bg3.readCNT(1);
                break;
            case IORegions.BG3CNT + 1:
                result = this.bg3.readCNT(2);
                break;
            case IORegions.WININ:
                result = this.win0.read();
                break;
            case IORegions.WININ + 1:
                result = this.win1.read();
                break;
            case IORegions.WINOUT:
                result = this.winOut.read();
                break;
            case IORegions.WINOUT + 1:
                result = this.objWin.read();
                break;
        }

        return u8(result);
    }

}
