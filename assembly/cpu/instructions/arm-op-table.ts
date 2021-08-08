
import { ARM7CPU } from '../cpu';
import * as arm from './arm/arm';
import { opHandler } from "./instructions";


// If you are reading this, you haven't generated the ARM opcode table.
export const armOpTable: StaticArray<StaticArray<opHandler | null>> = []