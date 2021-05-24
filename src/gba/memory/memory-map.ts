import { uint16, uint32, uint8 } from "../utils/types";
import MemoryAccessor from "./memory-accessor";

export class MemoryMap {




    read32(address: uint32, accessor: MemoryAccessor): uint32 {
        return 1;
    }

    read16(address: uint32, accessor: MemoryAccessor): uint16 {

        return 1;
    }

    read8(address: uint32, accessor: MemoryAccessor): uint8 {
        return 1;
    }

    write8(address: uint32, accessor: MemoryAccessor, value: uint8) {

    }

    write16(address: uint32, accessor: MemoryAccessor, value: uint16) {

    }

    write32(address: uint32, accessor: MemoryAccessor, value: uint32) {

    }

}
