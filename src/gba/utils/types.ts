
const UINT32ARRAY = new Uint32Array(1);
const UINT16ARRAY = new Uint16Array(1);
const UINT8ARRAY = new Uint8Array(1);
const INT32ARRAY = new Int32Array(1);
const INT16ARRAY = new Int16Array(1);
const INT8ARRAY = new Int8Array(1);


export type uint32 = number;
export type uint16 = number;
export type uint8 = number;
export type int32 = number;
export type int16 = number;
export type int8 = number;

export function uint32(val: number): uint32 {
    UINT32ARRAY[0] = val;
    return UINT32ARRAY[0];
}

export function uint16(val: number): uint16 {
    UINT16ARRAY[0] = val;
    return UINT16ARRAY[0];
}

export function uint8(val: number): uint8 {
    UINT8ARRAY[0] = val;
    return UINT8ARRAY[0];
}

export function int32(val: number): int32 {
    INT32ARRAY[0] = val;
    return INT32ARRAY[0];
}

export function int16(val: number): int16 {
    INT16ARRAY[0] = val;
    return INT16ARRAY[0];
}

export function int8(val: number): int8 {
    INT8ARRAY[0] = val;
    return INT8ARRAY[0];
}