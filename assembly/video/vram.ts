import { MemoryMapImpl } from "../memory/memory-map";
import { VideoUnitRegisters } from './video-controller';

export default class VRAM extends MemoryMapImpl {
    private registers: VideoUnitRegisters;

    constructor(regs: VideoUnitRegisters) {
        let data: Uint8Array = new Uint8Array(98304);
        super(data, 0x06000000);
        this.registers = regs
    };

}