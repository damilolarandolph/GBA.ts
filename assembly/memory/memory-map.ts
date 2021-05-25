import { u16, u32, u8 } from "../utils/types";
import MemoryAccessor from "./memory-accessor";

export class MemoryMap {




    read32(address: u32, accessor: MemoryAccessor): u32 {
        return 1;
    }

    read16(address: u32, accessor: MemoryAccessor): u16 {

        return 1;
    }

    read8(address: u32, accessor: MemoryAccessor): u8 {
        return 1;
    }

    write8(address: u32, accessor: MemoryAccessor, value: u8) {

    }

    write16(address: u32, accessor: MemoryAccessor, value: u16) {

    }

    write32(address: u32, accessor: MemoryAccessor, value: u32) {

    }

}