
import { ARM7CPU } from '../cpu';
import * as t from './thumb/thumb';

export type opHandler = (cpu: ARM7CPU) => void;

export const armOpTable:  StaticArray<StaticArray<opHandler | null>> = [




/** 0x0 **/[ t.LSL, t.LSL, t.LSL, t.LSL, t.LSL, t.LSL, t.LSL, t.LSL, t.LSR, t.LSR, t.LSR, t.LSR, t.LSR, t.LSR, t.LSR, t.LSR],
/** 0x1 **/[ t.ASR, t.ASR, t.ASR, t.ASR, t.ASR, t.ASR, t.ASR, t.ASR, t.ADD, t.ADD, t.SUB, t.SUB, t.ADD, t.ADD, t.SUB, t.SUB],
/** 0x2 **/[ t.MOV, t.MOV, t.MOV, t.MOV, t.MOV, t.MOV, t.MOV, t.MOV, t.CMP, t.CMP, t.CMP, t.CMP, t.CMP, t.CMP, t.CMP, t.CMP],
/** 0x3 **/[ t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.SUB, t.SUB, t.SUB, t.SUB, t.SUB, t.SUB, t.SUB, t.SUB],
/** 0x4 **/[ t.AND, t.ASR, t.TST, t.ORR, t.ADD, t.CMP, t.MOV, t.BX, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR],
/** 0x5 **/[ t.STR, t.STR, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.LDRSHB, t.LDRSHB, t.LDR, t.LDR, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB],
/** 0x6 **/[ t.STR, t.STR, t.STR, t.STR, t.STR, t.STR, t.STR, t.STR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR],
/** 0x7 **/[ t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB],
/** 0x8 **/[ t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.STRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB, t.LDRSHB],
/** 0x9 **/[ t.STR, t.STR, t.STR, t.STR, t.STR, t.STR, t.STR, t.STR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR, t.LDR],
/** 0xa **/[ t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD, t.ADD],
/** 0xb **/[ t.ADD, null, null, null, t.PUSH, t.PUSH, null, null, null, null, null, null, t.POP, t.POP, null, null],
/** 0xc **/[ t.STMIA, t.STMIA, t.STMIA, t.STMIA, t.STMIA, t.STMIA, t.STMIA, t.STMIA, t.LDMIA, t.LDMIA, t.LDMIA, t.LDMIA, t.LDMIA, t.LDMIA, t.LDMIA, t.LDMIA],
/** 0xd **/[ t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC, t.BC],
/** 0xe **/[ t.B, t.B, t.B, t.B, t.B, t.B, t.B, t.B, null, null, null, null, null, null, null, null],
/** 0xf **/[ t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX, t.BLBLX]
]