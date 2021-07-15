import { isHalfwordDataTransferImmediateOff } from "../cpu/instructions/arm/arm";
import { MemoryMapImpl } from "../memory/memory-map";
import { VideoUnitRegisters } from "./VideoUnitRegisters";

export default class VRAM extends MemoryMapImpl {
    private registers: VideoUnitRegisters;

    constructor(regs: VideoUnitRegisters) {
        let data: Uint8Array = new Uint8Array(98304);
        super(data, 0x06000000);
        this.registers = regs
    };


    get buffer(): Uint8Array {
        return this.data;
    }

}