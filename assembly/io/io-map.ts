import MemoryAccessor from "../memory/memory-accessor";
import MemoryMap from "../memory/memory-map";
import IODevice from "./io-device";

export class IOMap implements MemoryMap {

    private videoController: IODevice;

    constructor(videoController: IODevice) {
        this.videoController = videoController;
    }

    private getDeviceForAddress(address: u32): IODevice {
        if (address >= 0x4000000 && address <= 0x4000056) {
            return this.videoController;
        }
        return this.videoController;
    }
    read32(address: u32, accessor: MemoryAccessor): u32 {
        return this.getDeviceForAddress(address).readIO(address);
    }

    read16(address: u32, accessor: MemoryAccessor): u16 {
        return u16(this.getDeviceForAddress(address).readIO(address));
    }

    read8(address: u32, accessor: MemoryAccessor): u8 {
        return u16(this.getDeviceForAddress(address).readIO(address));
    }

    write8(address: u32, accessor: MemoryAccessor, value: u8): void {
        this.getDeviceForAddress(address).writeIO(address, value);
    }

    write16(address: u32, accessor: MemoryAccessor, value: u16): void {
        this.getDeviceForAddress(address).writeIO(address, value);
    }

    write32(address: u32, accessor: MemoryAccessor, value: u32): void {
        this.getDeviceForAddress(address).writeIO(address, value);
    }
}