import { callbacks } from "..";
import { InterruptManager, Interrupts } from "../cpu/interrupt-manager";
import IODevice from "../io/io-device";
import { Scheduler } from "../scheduler";
import { CompositionMixer } from "./CompositionMixer";
import { OAM } from "./oam";
import PaletteRam from "./palette-ram";
import { VideoEvent, VideoEvents } from "./video-events";
import { GPURegisters } from "./VideoUnitRegisters";
import VRAM from "./vram";


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


export class VideoController implements IODevice {

    public OAM: OAM;
    public VRAM: VRAM;
    public paletteRAM: PaletteRam;
    private registers: GPURegisters;
    private interruptManager: InterruptManager;
    private writeBuffer: Uint16Array = new Uint16Array(38400);
    private readBuffer: Uint16Array = new Uint16Array(38400);
    private composition: CompositionMixer = new CompositionMixer();
    private scheduler: Scheduler;



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
                this.drawMode4Line(BGLayers.BG_2, changetype<usize>(this.composition.BG2));
                this.composition.mix(
                    changetype<usize>(this.writeBuffer) + (this.registers.ly * 240),
                    this.registers,
                    BGLayers.BG_2,
                    BGLayers.BG_2);
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


    private drawMode4Line(layer: BGLayers, buf: usize): void {
        let vramPointer = changetype<usize>(this.VRAM.buffer);
        let palettePointer = changetype<usize>(this.paletteRAM.buffer);
        let currentLine = this.registers.ly;
        // Move pointer to current line
        vramPointer += (currentLine * 240)

        for (let index = 0; index < 240; ++index) {
            let colour = load<u8>(index + <i32>vramPointer);
            let palette = this.paletteRAM.getColour(colour);
            store<u16>(buf, palette);
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

        if (this.registers.ly <= 160) {
            this.drawLine();
        }

        this.registers.hBlankFlag = true;
        if (this.registers.ly <= 160 && this.registers.hBlankIRQEnable) {
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
            callbacks.newFrame();
        } else {
            ++this.registers.ly;
        }
    }

    public vblankEnd(s: Scheduler, tardiness: u64): void {
        //do some stuff
    }

    get currentFrame(): Uint16Array {
        return this.readBuffer;
    }




    private drawOBJLine(): void {

    }


    tick(): void {

    }




}


