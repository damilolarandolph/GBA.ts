import { MemoryMapImpl } from "./memory-map";

export default class BIOS extends MemoryMapImpl {

    constructor() {
        let data: Uint8Array = new Uint8Array(16384);
        super(data, 0);
    }
}