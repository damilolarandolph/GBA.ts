import { callbacks } from "..";
import { InterruptManager, Interrupts } from "../cpu/interrupt-manager";
import IODevice from "../io/io-device";
import { Scheduler } from "../scheduler";
import { OAM } from "./oam";
import PaletteRam from "./palette-ram";
import { VideoEvent, VideoEvents } from "./video-events";
import { Dimension, GPURegisters, Window } from "./VideoUnitRegisters";
import VRAM from "./vram";
import { console } from "./../index";


export enum BGModes {
    MODE_0,
    MODE_1,
    MODE_2,
    MODE_3,
    MODE_4,
    MODE_5
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
    OBJ,
    OUT,
}


@unmanaged class Pixel {
    colour: u16;
    priority: u16;
}


const layerCache = new StaticArray<usize>(5);
layerCache[0] = heap.alloc(offsetof<Pixel>() * 240);
layerCache[1] = heap.alloc(offsetof<Pixel>() * 240);
layerCache[2] = heap.alloc(offsetof<Pixel>() * 240);
layerCache[3] = heap.alloc(offsetof<Pixel>() * 240);
layerCache[4] = heap.alloc(offsetof<Pixel>() * 240);
changetype<Pixel>(layerCache[0]).colour = 40;

trace("OFFSET SIZE", 2, sizeof<Pixel>(), offsetof<Pixel>())
trace("NEW COLOUR", 1, changetype<Pixel>(layerCache[0]).colour);


export class VideoController implements IODevice {

    public OAM: OAM;
    public VRAM: VRAM;
    public paletteRAM: PaletteRam;
    private registers: GPURegisters;
    private interruptManager: InterruptManager;
    private writeBuffer: Uint8ClampedArray = new Uint8ClampedArray(153600);
    private readBuffer: Uint8ClampedArray = new Uint8ClampedArray(153600);
    private scheduler: Scheduler;
    private objWindowDimensions: Dimension = new Dimension();




    constructor(oam: OAM,
        vram: VRAM,
        paletteRAM: PaletteRam,
        interruptManager: InterruptManager,
        videoRegs: GPURegisters,
        scheduler: Scheduler
    ) {
        this.OAM = oam;
        this.registers = videoRegs;
        this.VRAM = vram;
        this.paletteRAM = paletteRAM;
        this.interruptManager = interruptManager;
        this.scheduler = scheduler;
        VideoEvents.HBLANK.controller = this;
        VideoEvents.HBLANK_END.controller = this;
        VideoEvents.HBLANK.handler = VideoEvents.HBLANK_HANDLER;
        VideoEvents.HBLANK_END.handler = VideoEvents.HBLANK_END_HANDLER;
        this.scheduler.schedule(VideoEvents.HBLANK, 960);

    }
    writeIO(address: u32, value: u8): void {
        address &= 0x3FFFFFF;
        this.registers.write(address, value);
    }
    readIO(address: u32): u8 {
        address &= 0x3FFFFFF;
        return this.registers.read(address);
    }

    drawLine(): void {

        switch (this.registers.BGMODE) {
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
                this.drawMode4Line(BGLayers.BG_2, layerCache[2]);
                this.mixLayers(
                    BGLayers.BG_2,
                    BGLayers.BG_2);
                break;
            case BGModes.MODE_5:
                this.drawMode5Line();
                break;

        }


    }

    private mixLayers(layerStart: BGLayers, layerEnd: BGLayers): void {

        let regs = this.registers;
        let currentLine = regs.ly;
        let bufStart = (u32(currentLine) * 160) * 4;
        for (let index = 0; index < 240; ++index) {
            let topLayer: BGLayers = -1;
            let topCompPixel: Pixel | null = null;
            //let spritePixel = unchecked(this.OBJ[index]);
            let window: Window | null = null;

            for (let win = 0; win < WindowLayers.OUT; ++win) {
                if (!regs.isWindow(win)) {
                    continue;
                }
                if (window == null) {
                    window = regs.win[WindowLayers.OUT];
                }
                if (regs.win[win].dimensions.containsPoint(index, currentLine)) {
                    window = regs.win[win];
                    break;
                }
            }

            for (let layerIndex = layerStart; layerIndex <= layerEnd; ++layerIndex) {

                let newTop = changetype<Pixel>(layerCache[layerIndex] + (index * offsetof<Pixel>()));

                if (!regs.isBG(layerIndex))
                    continue;

                if (window != null && (!window.isBG(layerIndex))
                ) {
                    continue;
                }


                if (topCompPixel) {
                    if (topCompPixel.colour == 0 || topCompPixel.priority > newTop.priority) {
                        topCompPixel = newTop;
                        topLayer = layerIndex;
                    }
                } else {
                    topCompPixel = newTop;
                    topLayer = layerIndex;
                }
            }

            // Can no pixel be found ? 
            let rgbaStride: u32 = bufStart + (index * 4);
            // trace("LINE", 1, currentLine);
            let colour = topCompPixel ? topCompPixel.colour : 0;
            //   trace("Stride BufStart", 3, rgbaStride, bufStart, (index * 4) + bufStart);
            //trace("Colour", 1, colour);

            // Red
            this.writeBuffer[rgbaStride] = u8(colour & 0x1f);
            // Green
            this.writeBuffer[rgbaStride + 1] = u8((colour >>> 5) & 0x1f);
            // Blue
            this.writeBuffer[rgbaStride + 2] = u8((colour >>> 10) & 0x1f);
            //Alpha (Full Transparency)
            this.writeBuffer[rgbaStride + 3] = 255;
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


    private drawMode4Line(layer: BGLayers, pixelLinePointer: usize): void {
        let vramPointer = changetype<usize>(this.VRAM.buffer);
        let currentLine = this.registers.ly;
        // Move pointer to current line
        vramPointer += (currentLine * 240)

        for (let index = 0; index < 240; ++index) {
            let pixelPointer = pixelLinePointer + (index * offsetof<Pixel>());
            let pixel: Pixel = changetype<Pixel>(pixelPointer);
            let colour = load<u8>(index + <i32>vramPointer);
            let palette = this.paletteRAM.getColour(colour);
            // if (palette != 0) {
            //     trace("Palette", 1, palette)
            // }
            pixel.colour = palette;
        }

    }
    private drawMode5Line(): void {

    }

    public hblank(s: Scheduler, tardiness: u64): void {
        if (this.registers.ly == this.registers.vCountSetting) {
            this.registers.vCounterFlag = true;
            if (this.registers.vCounterIRQEnable) {
                this.interruptManager.requestInterrupt(Interrupts.COUNTERMATCH);
            }
        }

        if (this.registers.ly == 160) {
            this.registers.vBlankFlag = true;
            if (this.registers.vBlankIRQEnable) {
                this.interruptManager.requestInterrupt(Interrupts.VBLANK);
            }
        } else if (this.registers.ly == 227) {
            this.registers.vBlankFlag = false;
        }

        if (this.registers.ly < 160) {
            this.drawLine();
        }

        this.registers.hBlankFlag = true;
        if (this.registers.ly < 160 && this.registers.hBlankIRQEnable) {
            this.interruptManager.requestInterrupt(Interrupts.HBLANK);
        }
        this.scheduler.schedule(VideoEvents.HBLANK_END, 272 - tardiness);
    }

    public hblankEnd(s: Scheduler, tardiness: u64): void {
        this.scheduler.schedule(VideoEvents.HBLANK, 960 - tardiness);
        this.registers.hBlankFlag = false;

        if (this.registers.ly == 227) {
            // Swap buffers once frame is done
            let temp = this.readBuffer;
            this.readBuffer = this.writeBuffer;
            this.writeBuffer = temp;
            this.registers.ly = 0;
            callbacks.newFrame(changetype<usize>(this.readBuffer));
            //  trace("Is scheduling", 1, f32(this.scheduler.timeStamp <= 280896))
        } else {
            ++this.registers.ly;
        }
    }

    public vblankEnd(s: Scheduler, tardiness: u64): void {
        //do some stuff
    }

    get currentFrame(): Uint8ClampedArray {
        return this.readBuffer;
    }




    private drawOBJLine(): void {

    }


    tick(): void {

    }




}


