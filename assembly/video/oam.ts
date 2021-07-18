import { MemoryMapImpl } from "../memory/memory-map";

export class OAM extends MemoryMapImpl {

    constructor() {
        let data: Uint8Array = new Uint8Array(1024);
        super(data, 0x07000000);
    }


    get buffer(): Uint8Array {
        return this.data;
    }

}