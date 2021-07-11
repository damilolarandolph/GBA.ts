import { MemoryMapImpl } from "./memory-map";

//256K On board WRAM
export class WRAM1 extends MemoryMapImpl {
    constructor() {
        let data: Uint8Array = new Uint8Array(262144);
        super(data, 0x02000000);
    }
}

// 32KB Onchip WRAM
export class WRAM2 extends MemoryMapImpl {

    constructor() {

        let data: Uint8Array = new Uint8Array(32768);
        super(data, 0x03000000)
    }

}