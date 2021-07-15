import { MemoryMap } from "../memory/memory-map";
import IODevice from "./io-device";

export class IOMap implements MemoryMap {

    private videoController: IODevice;

    constructor(videoController: IODevice) {
        this.videoController = videoController;
    }

    private getDeviceForAddress(address: u32): IODevice | null {
        if (address >= 0x4000000 && address <= 0x4000056) {
            return this.videoController;
        }
        trace("UNKNOWN IO DEVICE AT ADDRESS", 1, address);
        return null;
    }
    read32(address: u32,): u32 {
        let device = this.getDeviceForAddress(address);
        if (!device) {
            return 0;
        }
        let val: u32 = (u32(device.readIO(address + 3)) << 24)
            | (u32(device.readIO(address + 2)) << 16)
            | (u32(device.readIO(address + 1)) << 8)
            | (u32(device.readIO(address)))
        return val;
    }

    read16(address: u32,): u16 {
        let device = this.getDeviceForAddress(address);
        if (!device) {
            return 0;
        }
        let val: u16 = (u16(device.readIO(address + 1)) << 8)
            | (u16(device.readIO(address)))
        return val;
    }

    read8(address: u32,): u8 {
        let device = this.getDeviceForAddress(address);
        if (!device) {
            return 0;
        }

        return device.readIO(address);
    }

    write8(address: u32, value: u8): void {
        let device = this.getDeviceForAddress(address);
        if (!device) {
            return;
        }

        device.writeIO(address, value);
    }

    write16(address: u32, value: u16): void {
        let device = this.getDeviceForAddress(address);
        if (!device) {
            return;
        }

        device.writeIO(address, u8(value & 0xff))
        value >>>= 8;
        device.writeIO(address + 1, u8(value & 0xff))
    }

    write32(address: u32, value: u32): void {
        let device = this.getDeviceForAddress(address);
        if (!device) {
            return;
        }
        device.writeIO(address, u8(value & 0xff))
        value >>>= 8;
        device.writeIO(address + 1, u8(value & 0xff))
        value >>>= 8;
        device.writeIO(address + 2, u8(value & 0xff))
        value >>>= 8;
        device.writeIO(address + 3, u8(value & 0xff))
    }
}
