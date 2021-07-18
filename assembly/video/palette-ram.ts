import { MemoryMapImpl } from "../memory/memory-map";

export default class PaletteRam extends MemoryMapImpl {
    // 1K ?

    constructor() {
        let data: Uint8Array = new Uint8Array(1024);
        super(data, 0x05000000)
    }


    get buffer(): Uint8Array {
        return this.data;
    }

    getColour(index: u8): u16 {
        let ptr = changetype<usize>(this.data);
        ptr += (index * 2);
        return load<u16>(ptr);
    }

}