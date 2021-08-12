import * as cpu from "./cpu/cpu";
import { InterruptManager } from "./cpu/interrupt-manager";
import { GamePak, cartData } from "./gamepak/gamepak";
import { IOMap } from "./io/io-map";
import BIOS from "./memory/BIOS";
import { SystemMemory } from "./memory/memory";
import { WRAM1, WRAM2 } from "./memory/WRAM";
import { Scheduler } from "./scheduler";
import { OAM } from "./video/oam";
import PaletteRam from "./video/palette-ram";
import { VideoController } from "./video/video-controller";
import { GPURegisters } from "./video/VideoUnitRegisters";
export { cartData } from './gamepak/gamepak';
import VRAM from "./video/vram";
import { Keypad } from "./keypad";
export class GBA {
    private cpu: cpu.ARM7CPU;
    private videoUnit: VideoController;
    private gamePak: GamePak = new GamePak();
    private systemMemory: SystemMemory;
    private IOMap: IOMap;
    private OAM: OAM = new OAM();
    private VRAM: VRAM;
    private videoRegisters: GPURegisters = new GPURegisters();
    private WRAM: WRAM1 = new WRAM1();
    private WRAM2: WRAM2 = new WRAM2();
    private PaletteRam: PaletteRam = new PaletteRam();
    private BIOS: BIOS = new BIOS();
    private scheduler: Scheduler = new Scheduler();
    private interruptManager: InterruptManager = new InterruptManager(this.scheduler);
    private keyPad: Keypad = new Keypad(this.interruptManager);
    private frameMultiplier: u64 = 1;

    constructor() {
        this.VRAM = new VRAM(this.videoRegisters);
        this.videoUnit = new VideoController(
            this.OAM,
            this.VRAM,
            this.PaletteRam,
            this.interruptManager,
            this.videoRegisters,
            this.scheduler
        );
        this.IOMap = new IOMap(
            this.videoUnit,
            this.keyPad);
        this.systemMemory = new SystemMemory(
            this.BIOS,
            this.WRAM,
            this.WRAM2,
            this.IOMap,
            this.gamePak,
            this.videoUnit.paletteRAM,
            this.videoUnit.VRAM,
            this.videoUnit.OAM
        );
        this.cpu = new cpu.ARM7CPU(
            this.systemMemory,
            this.interruptManager,
            this.scheduler
        );
    }

    run(): void {
        while (true) {
            if (this.scheduler.canProcess) {
                this.scheduler.processEvents();
            } else {
                this.cpu.tick();
            }
        }
    }


    bios(): BIOS {
        return this.BIOS;
    }

    getMem(): SystemMemory {
        return this.systemMemory;
    }

    getGamePAK(): Uint8Array {
        return cartData;
    }

    getVideo(): VideoController {
        return this.videoUnit;
    }

    step(): void {
        if (this.scheduler.canProcess) {
            this.scheduler.processEvents();
        } else {
            this.cpu.tick();
        }
    }

    runFrame(): void {
        let startTime = this.scheduler.timeStamp;
        while (this.scheduler.timeStamp - startTime <= 280896) {
            this.step();
        }
    }

    getKeyPad(): Keypad {
        return this.keyPad;
    }
    getCPU(): cpu.ARM7CPU {
        return this.cpu;
    }
}