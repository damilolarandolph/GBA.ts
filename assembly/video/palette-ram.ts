import { MemoryMapImpl } from "../memory/memory-map";

export default class PaletteRam extends MemoryMapImpl {
    // 1K ?

    constructor() {
        let data: Uint8Array = new Uint8Array(1024);
        super(data, 0x05000000)
    }

}