import MemoryAccessor from './memory-accessor';

export default interface MemoryMap {
    read32(address: u32, accessor: MemoryAccessor): u32;

    read16(address: u32, accessor: MemoryAccessor): u16;

    read8(address: u32, accessor: MemoryAccessor): u8;

    write8(address: u32, accessor: MemoryAccessor, value: u8): void

    write16(address: u32, accessor: MemoryAccessor, value: u16): void

    write32(address: u32, accessor: MemoryAccessor, value: u32): void
}