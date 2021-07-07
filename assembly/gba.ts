import * as cpu from "./cpu/cpu";
import InterruptManager from "./cpu/interrupt-manager";
import GamePak from "./gamepak/gamepak";
import { IOMap } from "./io/io-map";
import BIOS from "./memory/BIOS";
import { SystemMemory } from "./memory/memory";
import { WRAM1, WRAM2 } from "./memory/WRAM";
import { OAM } from "./video/oam";
import PaletteRam from "./video/palette-ram";
import { VideoController, VideoUnitRegisters } from "./video/video-controller";
export { cartData } from './gamepak/gamepak';
import VRAM from "./video/vram";
export class GBA {
    private cpu: cpu.ARM7CPU;
    private videoUnit: VideoController;
    private gamePak: GamePak = new GamePak();
    private systemMemory: SystemMemory;
    private IOMap: IOMap;
    private OAM: OAM = new OAM();
    private VRAM: VRAM;
    private videoRegisters: VideoUnitRegisters = new VideoUnitRegisters();
    private WRAM: WRAM1 = new WRAM1();
    private WRAM2: WRAM2 = new WRAM2();
    private PaletteRam: PaletteRam = new PaletteRam();
    private BIOS: BIOS = new BIOS();
    private interruptManager: InterruptManager = new InterruptManager();
    private cycles: u32 = 0;

    constructor() {
        this.VRAM = new VRAM(this.videoRegisters);
        this.videoUnit = new VideoController(
            this.OAM,
            this.VRAM,
            this.PaletteRam,
            this.interruptManager,
            this.videoRegisters
        );
        this.IOMap = new IOMap(this.videoUnit);
        this.systemMemory = new SystemMemory(
            this.BIOS,
            this.WRAM,
            this.WRAM2,
            this.IOMap,
            this.gamePak,
            this.videoUnit);
        this.cpu = new cpu.ARM7CPU(
            this.systemMemory,
            this.interruptManager,
        );
    }

    run(): i32 {
        //startFrame();
        while (true) {
            // if (this.cycles >= 280000) {
            //     this.cycles = 0;
            //     //       startFrame();
            // }
            this.cpu.tick();
            ++this.cycles
        }
        return 0;
    }


    bios(): BIOS {
        return this.BIOS;
    }

    step(): void {
        this.cpu.tick();
    }

    updateDMAListeners(): void {

    }

    updateCPUListeners(): void {
        this.cycles = 0;
    }

    getCPU(): cpu.ARM7CPU {
        return this.cpu;
    }
}