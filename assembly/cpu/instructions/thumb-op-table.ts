
import { ARM7CPU } from '../cpu';
import * as t from './thumb/thumb';

export type opHandler = (cpu: ARM7CPU) => void;


// If you're reading this, you haven't generated the thumb opcode table.
export const thumbOpTable: StaticArray<StaticArray<opHandler | null>> = []