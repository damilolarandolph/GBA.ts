

export namespace Timing {
    export enum MemoryRegions {
        BIOS,
        WRAM1,
        WRAM2,
        IO,
        PALETTE_RAM,
        VRAM,
        OAM,
        GAMEPAK_1,
        GAMEPAK_2,
        GAMEPAK_3,
        GAMEPAK_SRAM
    }
    export enum Access {
        SEQUENTIAL,
        NON_SEQUENTIAL
    }

    // Default GAMEPAK waitstates
    export var GAMEPAK_0_N: u32 = 4;
    export var GAMEPAK_0_S: u32 = 2;
    export var GAMEPAK_1_N: u32 = 4;
    export var GAMEPAK_1_S: u32 = 4;
    export var GAMEPAK_2_N: u32 = 4;
    export var GAMEPAK_2_S: u32 = 8;
    export var SRAM_WAIT: u32 = 4;

    function determineMemoryRegion(address: u32): MemoryRegions {
        if (address >= 0 && address <= 0x00003FFF) {
            return MemoryRegions.BIOS;
        }

        if (address >= 0x02000000 && address <= 0x0203FFFF) {
            return MemoryRegions.WRAM1;
        }

        if (address >= 0x03000000 && address <= 0x03007FFF) {
            return MemoryRegions.WRAM2;
        }

        if (address >= 0x04000000 && address <= 0x040003FE) {
            return MemoryRegions.IO;
        }

        if (address >= 0x05000000 && address <= 0x050003FF) {
            return MemoryRegions.PALETTE_RAM;
        }

        if (address >= 0x06000000 && address <= 0x06017FFF) {
            return MemoryRegions.VRAM;
        }

        if (address >= 0x07000000 && address <= 0x070003FF) {
            return MemoryRegions.OAM;
        }

        if (address >= 0x08000000 && address <= 0x09FFFFFF) {
            return MemoryRegions.GAMEPAK_1;
        }

        if (address >= 0x0A000000 && address <= 0x0BFFFFFF) {
            return MemoryRegions.GAMEPAK_2;
        }

        if (address >= 0x0C000000 && address <= 0x0DFFFFFF) {
            return MemoryRegions.GAMEPAK_3;
        }

        if (address >= 0x0E000000 && address <= 0x0E00FFFF) {
            return MemoryRegions.GAMEPAK_SRAM;
        }
        trace("Unknown memory region");
        return -1;

    }

    export function word(address: u32): u32 {
        let region = determineMemoryRegion(address);
        switch (region) {
            case MemoryRegions.BIOS:
            case MemoryRegions.WRAM2:
            case MemoryRegions.IO:
            case MemoryRegions.OAM:
                return 1;
            case MemoryRegions.PALETTE_RAM:
            case MemoryRegions.VRAM:
                return 2;
            case MemoryRegions.WRAM1:
                return 6;

            // Gamepak has a 16 bit bus so 32 bit accesses are split into
            // an initial nonsequential access and a sequential access
            case MemoryRegions.GAMEPAK_1:
                return 1 + GAMEPAK_0_N + GAMEPAK_0_S;
            case MemoryRegions.GAMEPAK_2:
                return 1 + GAMEPAK_1_N + GAMEPAK_1_S;
            case MemoryRegions.GAMEPAK_3:
                return 1 + GAMEPAK_2_N + GAMEPAK_2_S;
            default:
                trace("Unknown timing region");
                return 0;

        }
    }


    export function halfWord(address: u32): u32 {
        let region = determineMemoryRegion(address);
        switch (region) {
            case MemoryRegions.BIOS:
            case MemoryRegions.WRAM2:
            case MemoryRegions.IO:
            case MemoryRegions.OAM:
            case MemoryRegions.PALETTE_RAM:
            case MemoryRegions.VRAM:
                return 1;
            case MemoryRegions.WRAM1:
                return 3;

            case MemoryRegions.GAMEPAK_1:
                return 1 + GAMEPAK_0_N;
            case MemoryRegions.GAMEPAK_2:
                return 1 + GAMEPAK_1_N;
            case MemoryRegions.GAMEPAK_3:
                return 1 + GAMEPAK_2_N;
            default:
                trace("Unknown timing region");
                return 0;

        }
    }


    export function byte(address: u32): u32 {
        let region = determineMemoryRegion(address);
        switch (region) {
            case MemoryRegions.BIOS:
            case MemoryRegions.WRAM2:
            case MemoryRegions.IO:
            case MemoryRegions.OAM:
            case MemoryRegions.PALETTE_RAM:
            case MemoryRegions.VRAM:
                return 1;
            case MemoryRegions.WRAM1:
                return 3;

            case MemoryRegions.GAMEPAK_1:
                return 1 + GAMEPAK_0_N;
            case MemoryRegions.GAMEPAK_2:
                return 1 + GAMEPAK_1_N;
            case MemoryRegions.GAMEPAK_3:
                return 1 + GAMEPAK_2_N;
            case MemoryRegions.GAMEPAK_SRAM:
                return 1 + SRAM_WAIT;
            default:
                trace("Unknown timing region");
                return 0;

        }
    }


}






