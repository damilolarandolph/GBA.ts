import { isHalfwordDataTransferImmediateOff } from "../cpu/instructions/arm/arm";
import { MemoryMapImpl } from "../memory/memory-map";
import { GPURegisters } from "./VideoUnitRegisters";

export default class VRAM extends MemoryMapImpl {
    private registers: GPURegisters;

    constructor(regs: GPURegisters) {
        let data: Uint8Array = new Uint8Array(98304);
        super(data, 0x06000000);
        this.registers = regs
    };


    get buffer(): Uint8Array {
        return this.data;
    }

}